import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
// Removed: import { buffer } from 'micro';
import { clerkClient as getClerkClientInstance } from '@clerk/nextjs/server'; // Import Clerk client

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable Next.js body parsing for this route, as Stripe requires the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  const sig = req.headers.get('stripe-signature');
  // Read the raw body from NextRequest
  const bodyBuffer = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(bodyBuffer, sig!, webhookSecret);
  } catch (err: any) {
    console.error(`[WEBHOOK] Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  console.log('[WEBHOOK] Received Stripe event:', event.type, event.data.object);

  switch (event.type) {
    case 'checkout.session.completed': { // Use block scope for variables
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[WEBHOOK] CheckoutSession completed for ${session.id}, customer ${session.customer}`);
      
      if (session.customer && session.mode === 'subscription') {
        const stripeCustomerId = session.customer as string;
        console.log(`[WEBHOOK] Attempting to retrieve Stripe customer: ${stripeCustomerId}`);
        try {
          const customer = await stripe.customers.retrieve(stripeCustomerId);
          // Check if customer is not deleted
          if (customer && !customer.deleted) {
            const clerkUserId = customer.metadata?.clerk_user_id;
            console.log(`[WEBHOOK] Retrieved customer. Clerk User ID from metadata: ${clerkUserId}`);
            if (clerkUserId) {
              const clerkClient = await getClerkClientInstance();
              const planId = session.line_items?.data[0]?.price?.id || null;
              console.log(`[WEBHOOK] Attempting to update Clerk metadata for user: ${clerkUserId} with planId: ${planId}`);
              await clerkClient.users.updateUserMetadata(clerkUserId, {
                publicMetadata: {
                  hasActiveSubscription: true,
                  stripePlanId: planId,
                  // You might also want to store stripeCustomerId here if not already done
                  // stripeCustomerId: stripeCustomerId
                }
              });
              console.log(`[WEBHOOK] Successfully updated Clerk metadata for user ${clerkUserId}: hasActiveSubscription = true, stripePlanId = ${planId}`);
              // TODO: Save/update subscription data in your database here as well
            } else {
              console.error(`[WEBHOOK] Clerk User ID not found in Stripe customer metadata for customer ${stripeCustomerId}`);
            }
          } else {
             console.error(`[WEBHOOK] Stripe customer ${stripeCustomerId} not found or deleted.`);
          }
        } catch (error) {
          console.error(`[WEBHOOK] Error retrieving Stripe customer or updating Clerk metadata:`, error);
        }
      } else {
        console.warn(`[WEBHOOK] Checkout session ${session.id} had no customer or was not a subscription.`);
      }
      break;
    }
    case 'customer.subscription.updated': { // Use block scope
      const subscriptionUpdated = event.data.object as Stripe.Subscription;
      console.log(`[WEBHOOK] Subscription updated: ${subscriptionUpdated.id}, status ${subscriptionUpdated.status}`);
      const stripeCustomerId = subscriptionUpdated.customer as string;
      const isActive = ['active', 'trialing'].includes(subscriptionUpdated.status);
      console.log(`[WEBHOOK] Attempting to retrieve Stripe customer for subscription update: ${stripeCustomerId}`);
      
      try {
        const customer = await stripe.customers.retrieve(stripeCustomerId);
        if (customer && !customer.deleted) {
          const clerkUserId = customer.metadata?.clerk_user_id;
          console.log(`[WEBHOOK] Retrieved customer for subscription update. Clerk User ID from metadata: ${clerkUserId}`);
          if (clerkUserId) {
            const clerkClient = await getClerkClientInstance();
            const planId = subscriptionUpdated.items.data[0]?.price?.id || null;
            console.log(`[WEBHOOK] Attempting to update Clerk metadata for user ${clerkUserId} on subscription update. isActive: ${isActive}, planId: ${planId}`);
            await clerkClient.users.updateUserMetadata(clerkUserId, {
              publicMetadata: {
                hasActiveSubscription: isActive,
                stripePlanId: planId,
                // stripeSubscriptionStatus: subscriptionUpdated.status // Optionally store status
              }
            });
            console.log(`[WEBHOOK] Successfully updated Clerk metadata for user ${clerkUserId}: hasActiveSubscription = ${isActive}, stripePlanId = ${planId}`);
            // TODO: Update subscription status, plan, current_period_end in your database
          } else {
             console.error(`[WEBHOOK] Clerk User ID not found in Stripe customer metadata for customer ${stripeCustomerId}`);
          }
        } else {
           console.error(`[WEBHOOK] Stripe customer ${stripeCustomerId} not found or deleted for subscription update.`);
        }
      } catch (error) {
         console.error(`[WEBHOOK] Error retrieving Stripe customer or updating Clerk metadata for subscription update:`, error);
      }
      break;
    }
    case 'customer.subscription.deleted': { // Use block scope
      const subscriptionDeleted = event.data.object as Stripe.Subscription;
      console.log(`[WEBHOOK] Subscription deleted: ${subscriptionDeleted.id}`);
      const stripeCustomerId = subscriptionDeleted.customer as string;
      console.log(`[WEBHOOK] Attempting to retrieve Stripe customer for subscription deletion: ${stripeCustomerId}`);

      try {
        const customer = await stripe.customers.retrieve(stripeCustomerId);
         if (customer && !customer.deleted) {
          const clerkUserId = customer.metadata?.clerk_user_id;
          console.log(`[WEBHOOK] Retrieved customer for subscription deletion. Clerk User ID from metadata: ${clerkUserId}`);
          if (clerkUserId) {
            const clerkClient = await getClerkClientInstance();
            console.log(`[WEBHOOK] Attempting to update Clerk metadata for user ${clerkUserId} on subscription deletion.`);
            await clerkClient.users.updateUserMetadata(clerkUserId, {
              publicMetadata: {
                hasActiveSubscription: false,
                // Optionally clear the plan ID or set to a default 'free' plan ID if applicable
                stripePlanId: null, // Clear the plan ID on deletion
                // stripeSubscriptionStatus: 'canceled' // Optionally store status
              }
            });
            console.log(`[WEBHOOK] Successfully updated Clerk metadata for user ${clerkUserId}: hasActiveSubscription = false, stripePlanId = null`);
            // TODO: Update subscription status to 'canceled' or similar in your database
          } else {
             console.error(`[WEBHOOK] Clerk User ID not found in Stripe customer metadata for customer ${stripeCustomerId}`);
          }
        } else {
           console.error(`[WEBHOOK] Stripe customer ${stripeCustomerId} not found or deleted for subscription deletion.`);
        }
      } catch (error) {
         console.error(`[WEBHOOK] Error retrieving Stripe customer or updating Clerk metadata for subscription deletion:`, error);
      }
      break;
    }
    case 'invoice.payment_succeeded': { // Use block scope
      const invoicePaymentSucceeded = event.data.object as Stripe.Invoice;
      console.log(`[WEBHOOK] Invoice payment succeeded for ${invoicePaymentSucceeded.id}`);
      // TODO: If needed, update subscription renewal date or confirm active status
      break; // Added missing break statement
    }
    case 'invoice.payment_failed': { // Use block scope
      const invoicePaymentFailed = event.data.object as Stripe.Invoice;
      console.log(`[WEBHOOK] Invoice payment failed for ${invoicePaymentFailed.id}`);
      // Potentially update Clerk metadata if payment failure means subscription is no longer active
      // This might overlap with customer.subscription.updated events (e.g., status becomes 'past_due')
      // TODO: Notify user, update subscription status in DB
      break;
    }
    // ... handle other relevant event types
    default:
      console.warn(`[WEBHOOK] Unhandled event type ${event.type}`);
  } // End of switch statement

  return NextResponse.json({ received: true });
}