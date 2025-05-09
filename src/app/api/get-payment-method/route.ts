import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth, clerkClient as getClerkClientInstance } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clerkClient = await getClerkClientInstance();
    const user = await clerkClient.users.getUser(userId);
    const stripeCustomerId = user.publicMetadata?.stripeCustomerId as string | undefined;

    if (!stripeCustomerId) {
      console.warn(`[Get Payment Method API] Stripe Customer ID not found for user ${userId}.`);
      return NextResponse.json({ error: 'Stripe customer not found.' }, { status: 404 });
    }

    // Fetch payment methods for the customer
    const paymentMethods = await stripe.customers.listPaymentMethods(
      stripeCustomerId,
      { type: 'card', limit: 1 } // Assuming we only need the default card for display
    );

    if (paymentMethods.data.length > 0) {
      const card = paymentMethods.data[0].card;
      return NextResponse.json({
        brand: card?.brand,
        last4: card?.last4,
        exp_month: card?.exp_month,
        exp_year: card?.exp_year,
      });
    } else {
      return NextResponse.json({ message: 'No payment methods found.' }, { status: 200 });
    }

  } catch (error: any) {
    console.error('[Get Payment Method API] Error fetching payment method:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch payment method.' }, { status: 500 });
  }
}