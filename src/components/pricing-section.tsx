'use client';

import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { CheckCircle } from 'lucide-react'; // For trial indication

interface PricingSectionProps {
  handleSubscribe: (priceId: string) => Promise<void>;
  loadingPriceId: string | null;
}

// Plan details including levels for comparison
const PLANS = {
  PRO: {
    id: 'price_1RN9boAEvm0dTvhJHLti8iOs',
    name: 'Pro',
    level: 1,
    trialText: "Start Pro Trial",
    chooseText: "Choose Pro"
  },
  UNLIMITED: {
    id: 'price_1RN9cCAEvm0dTvhJuebJbEMe',
    name: 'Unlimited',
    level: 2,
    trialText: "Start Unlimited Trial",
    chooseText: "Choose Unlimited"
  },
};

// Helper to get plan details from PLAN_LIMITS or a similar structure
const PLAN_LEVELS: Record<string, number> = {
  [PLANS.PRO.id]: PLANS.PRO.level,
  [PLANS.UNLIMITED.id]: PLANS.UNLIMITED.level,
};

export default function PricingSection({ handleSubscribe, loadingPriceId }: PricingSectionProps) {
  const { isSignedIn, user, isLoaded } = useUser();

  const userMetadata = isLoaded && isSignedIn ? user?.publicMetadata : {};
  const currentPlanId = userMetadata?.stripePlanId as string | undefined;
  const hasActiveSubscription = userMetadata?.hasActiveSubscription === true;
  const hasHadFreeTrial = userMetadata?.hasHadFreeTrial === true;
  // const isTrialing = hasActiveSubscription && userMetadata?.stripeSubscriptionStatus === 'trialing'; // Assuming stripeSubscriptionStatus is in metadata
  // For simplicity, we'll rely on hasActiveSubscription, currentPlanId, and hasHadFreeTrial for now.

  const currentUserPlanLevel = currentPlanId ? PLAN_LEVELS[currentPlanId] ?? -1 : -1;

  const getButtonTextAndAction = (planKey: 'PRO' | 'UNLIMITED') => {
    const plan = PLANS[planKey];
    if (!isLoaded) return { text: 'Loading...', disabled: true, action: () => {} };
    if (loadingPriceId === plan.id) return { text: 'Processing...', disabled: true, action: () => {} };

    if (!hasActiveSubscription || !currentPlanId) {
      // If user has had a free trial before, show "Choose" instead of "Start Trial"
      const buttonText = hasHadFreeTrial ? plan.chooseText : plan.trialText;
      return { text: buttonText, disabled: false, action: () => handleSubscribe(plan.id) };
    }

    if (currentPlanId === plan.id) {
      return { text: 'Current Plan', disabled: true, action: () => {} }; // Or link to manage
    }

    if (plan.level > currentUserPlanLevel) {
      return { text: `Upgrade to ${plan.name}`, disabled: false, action: () => handleSubscribe(plan.id) };
    }

    if (plan.level < currentUserPlanLevel) {
      return { text: `Downgrade to ${plan.name}`, disabled: false, action: () => handleSubscribe(plan.id) };
    }

    // Fallback, should ideally not be reached if logic is complete
    return { text: `Switch to ${plan.name}`, disabled: false, action: () => handleSubscribe(plan.id) };
  };

  const proButton = getButtonTextAndAction('PRO');
  const unlimitedButton = getButtonTextAndAction('UNLIMITED');

  return (
    <section id="pricing" className="py-16 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Choose Your OptiRoutePro Plan</h2>
        <p className="text-muted-foreground mb-12 max-w-xl mx-auto">
          {hasHadFreeTrial
            ? "Choose your plan and get started today. Cancel anytime."
            : "Start with a 7-day free trial on any plan. Cancel anytime."}
        </p>
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 max-w-3xl mx-auto">
          {/* Pro Tier Card */}
          <div className={`border rounded-lg p-8 shadow-lg flex flex-col justify-between ${currentPlanId === PLANS.PRO.id ? 'border-primary border-2' : 'border-border'}`}>
            <div>
              <h3 className="text-2xl font-semibold mb-1">{PLANS.PRO.name}</h3>
              {!hasHadFreeTrial && (
                <p className="text-sm text-primary font-medium mb-2 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 mr-1" /> 7-Day Free Trial
                </p>
              )}
              <p className="text-4xl font-bold mb-4">$14.99<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
              <ul className="space-y-2 text-muted-foreground mb-6 text-left">
                <li>✓ Up to 30 optimizations per month</li>
                <li>✓ Up to 55 stops per route</li>
                <li>✓ Export full routes with one click</li>
                <li>✓ Standard support</li>
              </ul>
            </div>
            <Button
             className="w-full mt-4"
             variant={currentPlanId === PLANS.PRO.id ? "default" : "outline"}
             onClick={proButton.action}
             disabled={proButton.disabled}
            >
             {proButton.text}
            </Button>
          </div>

          {/* Unlimited Tier Card */}
          <div className={`border rounded-lg p-8 shadow-lg flex flex-col justify-between ${currentPlanId === PLANS.UNLIMITED.id ? 'border-primary border-2' : 'border-border'}`}>
            <div>
              <h3 className="text-2xl font-semibold mb-1">{PLANS.UNLIMITED.name}</h3>
               {!hasHadFreeTrial && (
                <p className="text-sm text-primary font-medium mb-2 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 mr-1" /> 7-Day Free Trial
                </p>
              )}
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
              variant={currentPlanId === PLANS.UNLIMITED.id ? "default" : "outline"}
              onClick={unlimitedButton.action}
              disabled={unlimitedButton.disabled}
            >
              {unlimitedButton.text}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}