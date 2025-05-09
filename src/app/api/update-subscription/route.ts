import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth, clerkClient as getClerkClientInstance } from '@clerk/nextjs/server';

// Updated Plan Limits - Pro and Unlimited ONLY
const PLAN_LIMITS_WITH_LEVELS = {
  // Pro Plan ($14.99/month, 7-day trial)
  'price_1RMkdoAEvm0dTvhJ2ZAeLPkj': { name: 'Pro', level: 1, maxOptimizations: 50, maxStops: 100 },
  // Unlimited Plan ($49.99/month, 7-day trial)
  'price_1RMkePAEvm0dTvhJro8NBlJF': { name: 'Unlimited', level: 2, maxOptimizations: Infinity, maxStops: Infinity },
};
// No DEFAULT_PLAN_ID_FOR_LEVELS as users must be on a trial or paid plan.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newPriceId } = await req.json();
    if (!newPriceId || typeof newPriceId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid newPriceId' }, { status: 400 });
    }

    const clerkClient = await getClerkClientInstance();
    const user = await clerkClient.users.getUser(userId);
    const userMetadata = user.publicMetadata || {};
    const stripeSubscriptionId = userMetadata.stripeSubscriptionId as string | undefined;
    const currentStripePlanId = userMetadata.stripePlanId as string | undefined;

    if (!stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription found to update.' }, { status: 404 });
    }
    if (!currentStripePlanId) {
      console.error(`[Update Sub API] User ${userId} has stripeSubscriptionId ${stripeSubscriptionId} but no currentStripePlanId in metadata.`);
      return NextResponse.json({ error: 'Current plan information is missing. Please contact support.' }, { status: 500 });
    }

    if (newPriceId === currentStripePlanId) {
        return NextResponse.json({ message: 'User is already subscribed to this plan.' }, { status: 200 });
    }

    console.log(`[Update Sub API] User ${userId} attempting to update subscription ${stripeSubscriptionId} from current plan ${currentStripePlanId} to new price ${newPriceId}`);

    const currentPlanDetails = PLAN_LIMITS_WITH_LEVELS[currentStripePlanId as keyof typeof PLAN_LIMITS_WITH_LEVELS];
    const newPlanDetails = PLAN_LIMITS_WITH_LEVELS[newPriceId as keyof typeof PLAN_LIMITS_WITH_LEVELS];

    if (!currentPlanDetails) {
       console.error(`[Update Sub API] Current plan details not found in constants for plan ID: ${currentStripePlanId}`);
       return NextResponse.json({ error: 'Invalid current plan configuration.' }, { status: 500 });
    }
    if (!newPlanDetails) {
        console.error(`[Update Sub API] New plan details not found for price ID: ${newPriceId}`);
        return NextResponse.json({ error: 'Invalid new plan selected.' }, { status: 400 });
    }

    const isUpgrade = newPlanDetails.level > currentPlanDetails.level;
    const isDowngrade = newPlanDetails.level < currentPlanDetails.level;

    if (isDowngrade) {
        console.log(`[Update Sub API] User ${userId} attempted to downgrade to ${newPriceId}. Downgrades are handled via support.`);
        return NextResponse.json({ error: 'Downgrades are handled via support. Please contact us to change your plan.' }, { status: 403 });
    }
    
    // Only Upgrades are processed by this API now
    console.log(`[Update Sub API] Processing upgrade for user ${userId}. Proration: create_prorations`);

    const subscriptionBeforeUpdate = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const currentItem = subscriptionBeforeUpdate.items.data[0];
    if (!currentItem) {
        return NextResponse.json({ error: 'Subscription item not found.' }, { status: 404 });
    }
    
    const updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [{
        id: currentItem.id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
      payment_behavior: 'default_incomplete', 
      cancel_at_period_end: false,
    });

    console.log(`[Update Sub API] Successfully requested subscription update for ${updatedSubscription.id}. Current status: ${updatedSubscription.status}`);
    
    // Update Clerk metadata: set new stripePlanId, nullify old downgrade/feature fields
    await clerkClient.users.updateUserMetadata(userId, { 
        publicMetadata: {
            ...userMetadata,
            stripePlanId: newPriceId,
            activeFeaturesPlanId: null, // No longer used with this simplified flow
            subscriptionDowngradeScheduledAt: null, // No longer used
        }
    });
    console.log(`[Update Sub API] Updated Clerk metadata for user ${userId}. New stripePlanId: ${newPriceId}. Cleared deprecated fields.`);

    if (updatedSubscription.status === 'past_due' || updatedSubscription.status === 'incomplete') {
        const latestInvoiceId = updatedSubscription.latest_invoice as string | null; // Will be an ID string

        if (latestInvoiceId) {
            console.log(`[Update Sub API] Upgrade: Subscription status is ${updatedSubscription.status}. Latest invoice ID is ${latestInvoiceId}. Retrieving this invoice.`);
            try {
                const invoice = await stripe.invoices.retrieve(latestInvoiceId);
                if (invoice && invoice.status === 'open' && invoice.hosted_invoice_url) {
                    console.log(`[Update Sub API] Upgrade: Invoice ${invoice.id} is open. Redirecting user to hosted invoice URL: ${invoice.hosted_invoice_url}`);
                    return NextResponse.json({
                        success: true,
                        requiresRedirectToInvoice: true,
                        hostedInvoiceUrl: invoice.hosted_invoice_url,
                        subscriptionId: updatedSubscription.id,
                        message: 'Subscription update requires payment. Please complete payment on the Stripe page.'
                    });
                } else if (invoice && invoice.status === 'paid') {
                     console.log(`[Update Sub API] Upgrade: Invoice ${invoice.id} was already paid (e.g. $0 proration or auto-success).`);
                } else {
                    console.log(`[Update Sub API] Upgrade: Invoice ${invoice?.id} status is ${invoice?.status}. Not redirecting. Will rely on webhooks.`);
                }
            } catch (invoiceError: any) {
                console.error(`[Update Sub API] Upgrade: Error retrieving invoice ${latestInvoiceId}: ${invoiceError.message}`, invoiceError);
            }
        }
    }
    
    let successMessage = `Subscription successfully updated to ${newPlanDetails.name}.`;
    if (updatedSubscription.status === 'past_due' || updatedSubscription.status === 'incomplete') {
        successMessage = `Subscription update to ${newPlanDetails.name} initiated. Status: ${updatedSubscription.status}. Payment may be required.`;
    }

    console.log(`[Update Sub API] Reached default response for subscription ${updatedSubscription.id}. Status: ${updatedSubscription.status}`);
    return NextResponse.json({ 
        success: true, 
        subscriptionId: updatedSubscription.id,
        newPlanId: newPriceId,
        subscriptionStatus: updatedSubscription.status,
        requiresRedirectToInvoice: false, 
        message: successMessage
    });

  } catch (error: any) {
    console.error('[Update Sub API] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update subscription.' }, { status: 500 });
  }
}