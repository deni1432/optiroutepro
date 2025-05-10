'use client';

import PricingSection from '@/components/pricing-section';
import SharedNavbar from '@/components/shared-navbar';
import { useSubscriptionManager } from '@/lib/hooks/useSubscriptionManager'; // Import the custom hook

export default function PricingPage() {
  const { handleSubscribe, loadingPriceId } = useSubscriptionManager(); // Use the hook

  // All other state and logic (useUser, stripePromise, useEffect, handleSubscribe function)
  // are now managed within the useSubscriptionManager hook.

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <SharedNavbar /> {/* Use the shared navbar component */}

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