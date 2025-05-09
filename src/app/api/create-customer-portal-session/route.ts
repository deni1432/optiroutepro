import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth, clerkClient as getClerkClientInstance } from '@clerk/nextjs/server'; // Correct import

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real application, you would fetch the Stripe Customer ID from your database
    // associated with the Clerk User ID. For this example, we'll assume the Clerk
    // user's publicMetadata contains the stripeCustomerId.
    // This is a simplification and should be replaced with a database lookup.
    const clerkClient = await getClerkClientInstance(); // Get the client instance
    const user = await clerkClient.users.getUser(userId);
    const stripeCustomerId = user.publicMetadata?.stripeCustomerId as string | undefined;

    if (!stripeCustomerId) {
      console.error(`[Customer Portal API] Stripe Customer ID not found for user ${userId}.`);
      return NextResponse.json({ error: 'Stripe customer not found.' }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${APP_URL}/dashboard?billing_portal_return=true`, // URL to return to after managing billing
    });

    console.log(`[Customer Portal API] Created billing portal session for customer ${stripeCustomerId}. URL: ${session.url}`);

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('[Customer Portal API] Error creating billing portal session:', error);
    return NextResponse.json({ error: error.message || 'Failed to create billing portal session.' }, { status: 500 });
  }
}