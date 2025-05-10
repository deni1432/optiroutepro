import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuth, clerkClient as getClerkClientInstance, User } from '@clerk/nextjs/server'; // Import User type
// Removed problematic EmailAddress import

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(req);

    if (!clerkUserId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { priceId } = await req.json(); // priceId of the Stripe Price object

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // TODO: Retrieve stripeCustomerId from your database based on clerkUserId
    // For now, let's try to find an existing Stripe customer by Clerk ID metadata
    // or create one if it doesn't exist (though ideally, customer creation is separate).
    
    let stripeCustomerId: string | null = null;

    // Option 1: Assume customer exists (retrieve from DB - placeholder)
    // stripeCustomerId = await getStripeCustomerIdFromDb(clerkUserId); 

    // Option 2: Search Stripe for customer by metadata (if not found in DB or DB not yet integrated)
    const clerkClient = await getClerkClientInstance(); // Await here
    const user: User = await clerkClient.users.getUser(clerkUserId); // Get user for email and metadata
    const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
    const customers = await stripe.customers.list({ email: primaryEmail });
    const existingCustomer = customers.data.find(c => c.metadata.clerk_user_id === clerkUserId);

    if (existingCustomer) {
      stripeCustomerId = existingCustomer.id;
    } else {
      // If no customer found, create one (this duplicates logic from create-stripe-customer, ideally call that or ensure it's run first)
      // clerkUser is user here
      const email = primaryEmail; // Use the email already fetched
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();

      if (!email) {
        return NextResponse.json({ error: 'User email not found for new Stripe customer' }, { status: 400 });
      }
      const newStripeCustomer = await stripe.customers.create({
        email: email,
        name: name || undefined,
        metadata: { clerk_user_id: clerkUserId },
      });
      stripeCustomerId = newStripeCustomer.id;
      // TODO: Save this newStripeCustomer.id to your database
    }

    if (!stripeCustomerId) {
        return NextResponse.json({ error: 'Stripe customer ID not found or could not be created.' }, { status: 500 });
    }

    // Check if user has had a free trial
    const userMetadata = user.publicMetadata || {};
    const hasHadFreeTrial = userMetadata.hasHadFreeTrial === true;

    // Define trial period, default to 7 days for this example
    // In a real app, you might fetch plan details to see if it *offers* a trial
    const PLAN_OFFERS_TRIAL = true; // Assume the selected plan offers a trial
    const TRIAL_DAYS = 7;

    const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {};
    if (PLAN_OFFERS_TRIAL && !hasHadFreeTrial) {
      subscriptionData.trial_period_days = TRIAL_DAYS;
    }

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: subscriptionData, // Use conditional trial data
      allow_promotion_codes: true, // Enable promotional codes
      success_url: `${APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`, // Redirect to dashboard on success
      cancel_url: `${APP_URL}/#pricing`, // Redirect to pricing page on cancellation
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error: any) {
    console.error('Error creating Stripe Checkout session:', error);
    return NextResponse.json({ error: error.message || 'Failed to create Stripe Checkout session' }, { status: 500 });
  }
}