import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth, clerkClient as getClerkClientInstance } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export async function POST(req: NextRequest) {
  console.log('[Cancel Subscription API] Received POST request.'); // Log start of request
  try {
    const { userId } = await auth();
    console.log(`[Cancel Subscription API] User ID: ${userId}`); // Log User ID
    if (!userId) {
      console.warn('[Cancel Subscription API] Unauthorized: No user ID found.'); // Log unauthorized
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clerkClient = await getClerkClientInstance();
    const user = await clerkClient.users.getUser(userId);
    const userMetadata = user.publicMetadata || {};
    const stripeSubscriptionId = userMetadata.stripeSubscriptionId as string | undefined;
    console.log(`[Cancel Subscription API] Stripe Subscription ID from metadata: ${stripeSubscriptionId}`); // Log subscription ID

    if (!stripeSubscriptionId) {
      console.warn(`[Cancel Subscription API] No active subscription found for user ${userId}.`); // Log no subscription
      return NextResponse.json({ error: 'No active subscription found to cancel.' }, { status: 404 });
    }

    console.log(`[Cancel Subscription API] Attempting to cancel subscription ${stripeSubscriptionId} in Stripe.`); // Log Stripe call attempt
    // Cancel the subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.cancel(stripeSubscriptionId);
    console.log(`[Cancel Subscription API] Successfully canceled subscription ${canceledSubscription.id}. Status: ${canceledSubscription.status}`); // Log Stripe success

    // Update Clerk metadata to reflect cancellation
    // The customer.subscription.deleted webhook should also handle this,
    // but we update here for a more immediate client-side reflection.
    console.log(`[Cancel Subscription API] Updating Clerk metadata for user ${userId}.`); // Log metadata update attempt
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...userMetadata,
        hasActiveSubscription: false,
        stripePlanId: null, // User no longer on a paid plan
        stripeSubscriptionId: null,
        subCycleStartDate: null,
        optimizationsUsedThisCycle: null, // Reset usage
        stripeCancelAtPeriodEnd: canceledSubscription.cancel_at_period_end, // Should be true if canceled immediately
        // Ensure old downgrade fields are cleared
        activeFeaturesPlanId: null,
        subscriptionDowngradeScheduledAt: null,
      },
    });
    console.log(`[Cancel Subscription API] Updated Clerk metadata for user ${userId} after cancellation.`); // Log metadata update success


    return NextResponse.json({ success: true, subscriptionStatus: canceledSubscription.status });

  } catch (error: any) {
    console.error('[Cancel Subscription API] Error canceling subscription:', error); // Log any errors
    return NextResponse.json({ error: error.message || 'Failed to cancel subscription.' }, { status: 500 });
  }
}