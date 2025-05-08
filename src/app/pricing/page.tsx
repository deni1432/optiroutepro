'use client';

import { useState } from 'react';
import PricingSection from '@/components/pricing-section'; // Import PricingSection
import { useUser } from '@clerk/nextjs'; // Keep useUser for handleSubscribe
import Header from '@/components/header'; // Import the new Header component

// Header component now handles nav, mobile menu, etc.

export default function PricingPage() {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const { isSignedIn } = useUser(); // Only need isSignedIn for this version of handleSubscribe

  const handleSubscribe = async (priceId: string) => {
    if (!isSignedIn) {
      // If not signed in, redirect to sign-in page with the priceId as a query parameter
      // This might not be strictly necessary if all subscribe buttons are on auth'd pages,
      // but good for robustness if PricingSection is used elsewhere.
      window.location.href = `/sign-in?priceId=${priceId}`;
      return;
    }

    setLoadingPriceId(priceId);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url; // Redirect to Stripe Checkout
      } else {
        throw new Error('Checkout session URL not found.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert(`Error: ${(error as Error).message}`);
    } finally {
      setLoadingPriceId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <Header /> {/* Use the reusable Header component */}

      <main className="flex-1">
        {/* Use the PricingSection component */}
        <PricingSection 
          handleSubscribe={handleSubscribe} 
          loadingPriceId={loadingPriceId} 
        />
      </main>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} OptiRoutePro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}