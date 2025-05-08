'use client';

import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs'; // Needed if we pass user or rely on its state directly here
import type { UserResource } from '@clerk/types'; // For typing the user prop

interface PricingSectionProps {
  handleSubscribe: (priceId: string) => Promise<void>;
  loadingPriceId: string | null;
  // Pass isLoaded and user if the main page already fetches them
  // Alternatively, this component could call useUser() itself if it's always client-side
  // For simplicity now, let's assume they are passed if needed by the button logic.
  // However, the original page.tsx uses useUser directly for button state,
  // so this component will also need access to that user state.
  // Let's make it self-contained with useUser for now.
}

export default function PricingSection({ handleSubscribe, loadingPriceId }: PricingSectionProps) {
  const { isSignedIn, user, isLoaded } = useUser();

  return (
    <section id="pricing" className="py-16">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
        <p className="text-muted-foreground mb-12 max-w-xl mx-auto">
          Choose the plan that's right for you. Get started for free, then upgrade as your needs grow.
        </p>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {/* Free Tier Card */}
          <div className="border rounded-lg p-8 shadow-lg">
            <h3 className="text-2xl font-semibold mb-2">Free</h3>
            <p className="text-4xl font-bold mb-4">$0<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
            <ul className="space-y-2 text-muted-foreground mb-6 text-left">
              <li>✓ Up to 10 optimizations per month</li>
              <li>✓ $0.75 per optimization afterwards</li>
              <li>✓ Up to 10 stops per route</li>
              <li>✓ Basic support</li>
            </ul>
            <Button
             className="w-full"
             variant="outline"
             onClick={() => handleSubscribe('price_1RMK7cAEvm0dTvhJd701pCMH')} // Replace with actual Price ID from .env
             disabled={loadingPriceId === 'price_1RMK7cAEvm0dTvhJd701pCMH' || (isLoaded && user?.publicMetadata?.stripePlanId === 'price_1RMK7cAEvm0dTvhJd701pCMH')}
            >
             {isLoaded && user?.publicMetadata?.stripePlanId === 'price_1RMK7cAEvm0dTvhJd701pCMH' ? 'Current Plan' : (loadingPriceId === 'price_1RMK7cAEvm0dTvhJd701pCMH' ? 'Processing...' : 'Get Started')}
            </Button>
          </div>
          {/* Pro Tier Card */}
          <div className="border-2 border-primary rounded-lg p-8 shadow-xl relative">
            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold rounded-full">
              Most Popular
            </div>
            <h3 className="text-2xl font-semibold mb-2">Pro</h3>
            <p className="text-4xl font-bold mb-4">$15<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
            <ul className="space-y-2 text-muted-foreground mb-6 text-left">
              <li>✓ Up to 50 optimizations per month</li>
              <li>✓ $0.45 per optimization afterwards</li>
              <li>✓ Up to 100 stops per route</li>
              <li>✓ Export full routes with one click</li>
              <li>✓ Priority support</li>
            </ul>
            <Button
              className="w-full"
              onClick={() => handleSubscribe('price_1RMK8MAEvm0dTvhJL9izaQxh')} // Replace with actual Price ID from .env
              disabled={loadingPriceId === 'price_1RMK8MAEvm0dTvhJL9izaQxh' || (isLoaded && user?.publicMetadata?.stripePlanId === 'price_1RMK8MAEvm0dTvhJL9izaQxh')}
            >
              {isLoaded && user?.publicMetadata?.stripePlanId === 'price_1RMK8MAEvm0dTvhJL9izaQxh' ? 'Current Plan' : (loadingPriceId === 'price_1RMK8MAEvm0dTvhJL9izaQxh' ? 'Processing...' : 'Choose Pro')}
            </Button>
          </div>
          {/* Unlimited Tier Card */}
          <div className="border rounded-lg p-8 shadow-lg">
            <h3 className="text-2xl font-semibold mb-2">Unlimited</h3>
            <p className="text-4xl font-bold mb-4">$50<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
            <ul className="space-y-2 text-muted-foreground mb-6 text-left">
              <li>✓ All Pro features</li>
              <li>✓ Unlimited stops per route</li>
              <li>✓ API access (soon)</li>
            </ul>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleSubscribe('price_1RMK8vAEvm0dTvhJDfaIEaUv')} // Replace with actual Price ID from .env
              disabled={loadingPriceId === 'price_1RMK8vAEvm0dTvhJDfaIEaUv' || (isLoaded && user?.publicMetadata?.stripePlanId === 'price_1RMK8vAEvm0dTvhJDfaIEaUv')}
            >
              {isLoaded && user?.publicMetadata?.stripePlanId === 'price_1RMK8vAEvm0dTvhJDfaIEaUv' ? 'Current Plan' : (loadingPriceId === 'price_1RMK8vAEvm0dTvhJDfaIEaUv' ? 'Processing...' : 'Choose Unlimited')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}