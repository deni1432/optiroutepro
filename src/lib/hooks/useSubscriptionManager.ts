'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { loadStripe, Stripe } from '@stripe/stripe-js';

export function useSubscriptionManager() {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  // isConfirmingPayment, pendingPaymentClientSecret, pendingPaymentIntentId are no longer needed with hosted invoice redirect
  const { isSignedIn, user, isLoaded } = useUser();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null); // Still needed for new subscriptions via Checkout

  useEffect(() => {
    const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (stripeKey) {
      setStripePromise(loadStripe(stripeKey));
    } else {
      console.error("Stripe publishable key is not set. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable.");
    }
  }, []);

  const handleSubscribe = async (newPriceId: string) => {
    if (!isLoaded) {
      console.log('useSubscriptionManager: User session not loaded yet.');
      return;
    }

    if (!isSignedIn) {
      console.log('useSubscriptionManager: User not signed in. Redirecting to sign-in.');
      // Ensure window.location is available (client-side)
      if (typeof window !== 'undefined') {
        window.location.href = `/sign-in?priceId=${newPriceId}&redirectUrl=${window.location.pathname}`;
      }
      return;
    }

    if (!stripePromise) {
      alert("Stripe is not initialized. Please check console for errors.");
      console.error('useSubscriptionManager: Stripe Promise not available.');
      return;
    }

    setLoadingPriceId(newPriceId);
    console.log(`useSubscriptionManager: Initiating subscription for priceId: ${newPriceId}`);

    try {
      const currentSubscriptionId = user?.publicMetadata?.stripeSubscriptionId as string | undefined;
      const currentPlanId = user?.publicMetadata?.stripePlanId as string | undefined;

      if (currentSubscriptionId && currentPlanId) {
        if (newPriceId === currentPlanId) {
          alert('You are already subscribed to this plan.');
          console.log('useSubscriptionManager: User already subscribed to this plan.');
          setLoadingPriceId(null);
          return;
        }

        console.log(`useSubscriptionManager: Attempting to update subscription to new plan: ${newPriceId}`);
        const response = await fetch('/api/update-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPriceId }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('useSubscriptionManager: Failed to update subscription.', result);
          throw new Error(result.error || 'Failed to update subscription.');
        }

        if (result.requiresRedirectToInvoice && result.hostedInvoiceUrl) {
          console.log('useSubscriptionManager: Subscription update requires payment. Redirecting to Stripe hosted invoice.');
          if (typeof window !== 'undefined') {
            window.location.href = result.hostedInvoiceUrl; // Revert to same-tab redirect
          }
          // No further action needed here as user is redirected
          setLoadingPriceId(null); // Clear loading state
          return; // Exit after redirect
        } else {
          // Generic message if no redirect needed (e.g. downgrade, or already paid upgrade)
          alert(result.message || 'Subscription update request processed.');
          console.log('useSubscriptionManager: Subscription update request processed.', result);
        }

        if (user && typeof user.reload === 'function') {
          await user.reload();
          console.log('useSubscriptionManager: Clerk user data reloaded.');
        }

      } else {
        console.log(`useSubscriptionManager: Attempting to create new subscription with plan: ${newPriceId}`);
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId: newPriceId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('useSubscriptionManager: Failed to create checkout session.', errorData);
          throw new Error(errorData.error || 'Failed to create checkout session');
        }

        const { url } = await response.json();
        if (url && typeof window !== 'undefined') {
          console.log('useSubscriptionManager: Redirecting to Stripe Checkout.');
          window.location.href = url;
        } else if (!url) {
          console.error('useSubscriptionManager: Checkout session URL not found.');
          throw new Error('Checkout session URL not found.');
        }
      }
    } catch (error) {
      console.error('useSubscriptionManager: Subscription operation error:', error);
      alert(`Error: ${(error as Error).message}`);
    } finally {
      setLoadingPriceId(null);
      console.log('useSubscriptionManager: Finished subscription attempt.');
    }
  };

  // handleConfirmPendingPayment and related states are no longer needed with hosted invoice redirect

  return {
    handleSubscribe,
    loadingPriceId
    // No longer returning pendingPaymentClientSecret, handleConfirmPendingPayment, isConfirmingPayment
  };
}