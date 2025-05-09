'use client';

import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { CheckCircle } from 'lucide-react'; // For trial indication

interface PricingSectionProps {
  handleSubscribe: (priceId: string) => Promise<void>;
  loadingPriceId: string | null;
}

const PRO_PLAN_PRICE_ID = 'price_1RMkdoAEvm0dTvhJ2ZAeLPkj';
const UNLIMITED_PLAN_PRICE_ID = 'price_1RMkePAEvm0dTvhJro8NBlJF';

export default function PricingSection({ handleSubscribe, loadingPriceId }: PricingSectionProps) {
  const { isSignedIn, user, isLoaded } = useUser();
  const currentPlanId = isLoaded && isSignedIn ? user?.publicMetadata?.stripePlanId as string | undefined : undefined;
  const isTrialing = isLoaded && isSignedIn ? user?.publicMetadata?.hasActiveSubscription === true && (user?.publicMetadata as any)?.stripeSubscriptionStatus === 'trialing' : false; // A bit verbose, might simplify if sub status is directly in metadata

  return (
    <section id="pricing" className="py-16 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Choose Your OptiRoutePro Plan</h2>
        <p className="text-muted-foreground mb-12 max-w-xl mx-auto">
          Start with a 7-day free trial on any plan. Cancel anytime.
        </p>
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 max-w-3xl mx-auto">
          {/* Pro Tier Card */}
          <div className={`border rounded-lg p-8 shadow-lg flex flex-col justify-between ${currentPlanId === PRO_PLAN_PRICE_ID ? 'border-primary border-2' : 'border-border'}`}>
            <div>
              <h3 className="text-2xl font-semibold mb-1">Pro</h3>
              <p className="text-sm text-primary font-medium mb-2 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 mr-1" /> 7-Day Free Trial
              </p>
              <p className="text-4xl font-bold mb-4">$14.99<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
              <ul className="space-y-2 text-muted-foreground mb-6 text-left">
                <li>✓ Up to 50 optimizations per month</li>
                <li>✓ Up to 100 stops per route</li>
                <li>✓ Export full routes with one click</li>
                <li>✓ Standard support</li>
              </ul>
            </div>
            <Button
             className="w-full mt-4"
             variant={currentPlanId === PRO_PLAN_PRICE_ID ? "default" : "outline"}
             onClick={() => handleSubscribe(PRO_PLAN_PRICE_ID)}
             disabled={loadingPriceId === PRO_PLAN_PRICE_ID || (isLoaded && currentPlanId === PRO_PLAN_PRICE_ID && !isTrialing)}
            >
             {isLoaded && currentPlanId === PRO_PLAN_PRICE_ID ? (isTrialing ? 'Extend Trial / Subscribe' : 'Current Plan') : (loadingPriceId === PRO_PLAN_PRICE_ID ? 'Processing...' : 'Start Pro Trial')}
            </Button>
          </div>
          
          {/* Unlimited Tier Card */}
          <div className={`border rounded-lg p-8 shadow-lg flex flex-col justify-between ${currentPlanId === UNLIMITED_PLAN_PRICE_ID ? 'border-primary border-2' : 'border-border'}`}>
            <div>
              <h3 className="text-2xl font-semibold mb-1">Unlimited</h3>
               <p className="text-sm text-primary font-medium mb-2 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 mr-1" /> 7-Day Free Trial
              </p>
              <p className="text-4xl font-bold mb-4">$49.99<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
              <ul className="space-y-2 text-muted-foreground mb-6 text-left">
                <li>✓ All Pro features</li>
                <li>✓ Unlimited optimizations</li>
                <li>✓ Unlimited stops per route</li>
                <li>✓ Priority support</li>
                <li>✓ API access (coming soon)</li>
              </ul>
            </div>
            <Button
              className="w-full mt-4"
              variant={currentPlanId === UNLIMITED_PLAN_PRICE_ID ? "default" : "outline"}
              onClick={() => handleSubscribe(UNLIMITED_PLAN_PRICE_ID)}
              disabled={loadingPriceId === UNLIMITED_PLAN_PRICE_ID || (isLoaded && currentPlanId === UNLIMITED_PLAN_PRICE_ID && !isTrialing)}
            >
              {isLoaded && currentPlanId === UNLIMITED_PLAN_PRICE_ID ? (isTrialing ? 'Extend Trial / Subscribe' : 'Current Plan') : (loadingPriceId === UNLIMITED_PLAN_PRICE_ID ? 'Processing...' : 'Start Unlimited Trial')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}