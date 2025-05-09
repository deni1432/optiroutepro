import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { clerkClient as getClerkClientInstance } from '@clerk/nextjs/server';

type ClerkClientInstance = Awaited<ReturnType<typeof getClerkClientInstance>>;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

async function updateUserMetadata(clerkClient: ClerkClientInstance, userId: string, metadataUpdates: Record<string, any>) {
  try {
    const user = await clerkClient.users.getUser(userId);
    const existingMetadata = user.publicMetadata || {};
    
    const finalPayloadForClerk: Record<string, any> = { ...existingMetadata };
    for (const key in metadataUpdates) {
       if (Object.prototype.hasOwnProperty.call(metadataUpdates, key)) {
           if (metadataUpdates[key] === null) {
               finalPayloadForClerk[key] = null; 
           } else {
               finalPayloadForClerk[key] = metadataUpdates[key];
           }
       }
    }
    // Ensure old fields are explicitly removed if they are not in metadataUpdates and we want them gone
    if (!Object.prototype.hasOwnProperty.call(metadataUpdates, 'activeFeaturesPlanId')) {
        finalPayloadForClerk['activeFeaturesPlanId'] = null;
    }
    if (!Object.prototype.hasOwnProperty.call(metadataUpdates, 'subscriptionDowngradeScheduledAt')) {
        finalPayloadForClerk['subscriptionDowngradeScheduledAt'] = null;
    }
     if (!Object.prototype.hasOwnProperty.call(metadataUpdates, 'pendingPaymentClientSecret')) {
        finalPayloadForClerk['pendingPaymentClientSecret'] = null;
    }
    if (!Object.prototype.hasOwnProperty.call(metadataUpdates, 'pendingPaymentIntentId')) {
        finalPayloadForClerk['pendingPaymentIntentId'] = null;
    }
    if (!Object.prototype.hasOwnProperty.call(metadataUpdates, 'pendingInvoiceId')) {
        finalPayloadForClerk['pendingInvoiceId'] = null;
    }


    console.log(`[WEBHOOK] Attempting updateUserMetadata for user ${userId} with payload:`, { publicMetadata: finalPayloadForClerk });
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: finalPayloadForClerk
     });
     console.log(`[WEBHOOK] Clerk API update call completed for user ${userId}.`);
 
     try {
        const updatedUser = await clerkClient.users.getUser(userId);
        console.log(`[WEBHOOK] VERIFICATION FETCH for user ${userId}. Current publicMetadata:`, updatedUser.publicMetadata);
     } catch (fetchError) {
        console.error(`[WEBHOOK] Error fetching user ${userId} immediately after update:`, fetchError);
     }
 
     console.log(`[WEBHOOK] Finished processing metadata update for user ${userId}. Applied Updates (intent):`, metadataUpdates);
   } catch (error) {
     console.error(`[WEBHOOK] Error during metadata update or verification for user ${userId}:`, error);
    throw new Error(`Failed to update Clerk metadata for user ${userId}`);
  }
}

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  const sig = req.headers.get('stripe-signature');
  const bodyBuffer = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(bodyBuffer, sig!, webhookSecret);
  } catch (err: any) {
    console.error(`[WEBHOOK] Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log('[WEBHOOK] Received Stripe event:', event.type, 'ID:', event.id);
  
  let clerkUserId: string | null = null;
  const clerkClient = await getClerkClientInstance(); 

  try {
    const stripeCustomerId = (event.data.object as any).customer as string | null;
    if (stripeCustomerId) {
        const customer = await stripe.customers.retrieve(stripeCustomerId);
        if (customer && !customer.deleted && customer.metadata?.clerk_user_id) {
            clerkUserId = customer.metadata.clerk_user_id;
        } else if ((event.data.object as any).client_reference_id && (event.type === 'checkout.session.completed')) {
            clerkUserId = (event.data.object as any).client_reference_id;
            if (customer && !customer.deleted && !customer.metadata?.clerk_user_id && clerkUserId) {
                console.log(`[WEBHOOK] Adding clerk_user_id ${clerkUserId} to Stripe customer ${stripeCustomerId} metadata.`);
                await stripe.customers.update(stripeCustomerId, { metadata: { clerk_user_id: clerkUserId } });
            }
        }
    }

    if (!clerkUserId && !['charge.succeeded', 'payment_intent.succeeded', 'payment_intent.created'].includes(event.type) ) {
        const criticalEvents = ['customer.subscription.updated', 'customer.subscription.deleted', 'invoice.paid', 'invoice.payment_succeeded', 'checkout.session.completed'];
        if (criticalEvents.includes(event.type)) {
             console.error(`[WEBHOOK] CRITICAL: Clerk User ID missing for important event type ${event.type}, ID ${event.id}. Stripe Customer ID: ${stripeCustomerId}.`);
             return NextResponse.json({ received: true, error: "Clerk User ID missing for critical event." });
        }
        console.warn(`[WEBHOOK] Could not determine Clerk User ID for event type ${event.type}, ID ${event.id}. Stripe Customer ID: ${stripeCustomerId}.`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        if (!clerkUserId) break; 
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = (session as any).subscription as string | null;

        if (session.customer && session.mode === 'subscription' && subscriptionId) {
          const subscriptionObject = await stripe.subscriptions.retrieve(subscriptionId);
          const planId = subscriptionObject.items.data[0]?.price?.id || null;
          console.log(`[WEBHOOK] NEW subscription via Checkout. User: ${clerkUserId}, Plan: ${planId}, Status: ${subscriptionObject.status}`);
          await updateUserMetadata(clerkClient, clerkUserId, {
            hasActiveSubscription: ['active', 'trialing'].includes(subscriptionObject.status),
            stripePlanId: planId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            subCycleStartDate: (subscriptionObject as any).current_period_start ?? Math.floor(Date.now() / 1000),
            optimizationsUsedThisCycle: 0,
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        if (!clerkUserId) break;
        const subscriptionObject = event.data.object as Stripe.Subscription;
        console.log(`[WEBHOOK] Subscription updated: ${subscriptionObject.id}, Status: ${subscriptionObject.status}`);
        
        const user = await clerkClient.users.getUser(clerkUserId);
        const existingMetadata = user.publicMetadata || {};
        
        const isActive = ['active', 'trialing'].includes(subscriptionObject.status);
        const newStripePlanId = subscriptionObject.items.data[0]?.price?.id || null;
        const newCycleStartDate = (subscriptionObject as any).current_period_start ?? Math.floor(Date.now() / 1000);
        let optimizationsUsed = existingMetadata.optimizationsUsedThisCycle as number || 0;

        // Reset usage if subscription is active and (plan changed OR cycle started anew)
        if (isActive && (newStripePlanId !== existingMetadata.stripePlanId || newCycleStartDate !== existingMetadata.subCycleStartDate)) {
          console.log(`[WEBHOOK] Subscription active and plan/cycle changed for user ${clerkUserId}. Resetting usage count.`);
          optimizationsUsed = 0;
        }

        console.log(`[WEBHOOK] Updating Clerk metadata for subscription update. User: ${clerkUserId}, Plan: ${newStripePlanId}, isActive: ${isActive}`);
        await updateUserMetadata(clerkClient, clerkUserId, {
          hasActiveSubscription: isActive,
          stripePlanId: newStripePlanId,
          stripeSubscriptionId: subscriptionObject.id,
          subCycleStartDate: newCycleStartDate,
          optimizationsUsedThisCycle: optimizationsUsed,
          stripeCancelAtPeriodEnd: subscriptionObject.cancel_at_period_end,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        if (!clerkUserId) break;
        console.log(`[WEBHOOK] Updating Clerk metadata for user ${clerkUserId} on subscription deletion.`);
        await updateUserMetadata(clerkClient, clerkUserId, {
          hasActiveSubscription: false,
          stripePlanId: null,
          stripeSubscriptionId: null,
          subCycleStartDate: null,
          optimizationsUsedThisCycle: null, 
          stripeCancelAtPeriodEnd: null,
        });
        break;
      }
      
      case 'invoice.payment_action_required': {
        // With hosted invoice redirect, this event is less likely to be the primary path for payment.
        // However, if it occurs (e.g. SCA needed after payment method added on hosted page),
        // we ensure the subscription is marked as not fully active.
        if (!clerkUserId) break;
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(`[WEBHOOK] Received invoice.payment_action_required for invoice ${invoice.id}. User ${clerkUserId}. Subscription may be past_due.`);
        await updateUserMetadata(clerkClient, clerkUserId, { hasActiveSubscription: false });
        break;
      }

      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        if (!clerkUserId) break;
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionIdFromInvoice = (invoice as any).subscription as string | null;
        console.log(`[WEBHOOK] Invoice paid/succeeded: ${invoice.id}, Sub ID: ${subscriptionIdFromInvoice}, Billing Reason: ${invoice.billing_reason}`);

        if (subscriptionIdFromInvoice) {
          const subscriptionObject = await stripe.subscriptions.retrieve(subscriptionIdFromInvoice);
          const currentPlanIdOnSub = subscriptionObject.items.data[0]?.price?.id || null;
          console.log(`[WEBHOOK] Invoice paid for user ${clerkUserId}. Updating subscription to active, plan ${currentPlanIdOnSub}, resetting usage.`);
          await updateUserMetadata(clerkClient, clerkUserId, {
            hasActiveSubscription: true, // Subscription is now active
            stripePlanId: currentPlanIdOnSub,
            stripeSubscriptionId: subscriptionObject.id,
            subCycleStartDate: (subscriptionObject as any).current_period_start ?? Math.floor(Date.now() / 1000),
            optimizationsUsedThisCycle: 0, // Reset usage on successful payment for new/renewed cycle
          });
        } else {
          console.log(`[WEBHOOK] Invoice paid/succeeded for ${invoice.id}, but no subscription ID found (e.g. one-time payment).`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        if (!clerkUserId) break;
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[WEBHOOK] Invoice payment failed: ${invoice.id}. User: ${clerkUserId}`);
        // Mark subscription as inactive. customer.subscription.updated should also handle this.
        await updateUserMetadata(clerkClient, clerkUserId, { hasActiveSubscription: false });
        break;
      }

      default:
        console.warn(`[WEBHOOK] Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error(`[WEBHOOK] Error processing event ${event.type} (ID: ${event.id}) for Clerk User ${clerkUserId || 'UNKNOWN'}:`, error);
  }

  return NextResponse.json({ received: true });
}