'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPinned, Users, Gift, Mail } from 'lucide-react';
import SharedNavbar from '@/components/shared-navbar';
import SharedFooter from '@/components/shared-footer';
import PricingSection from '@/components/pricing-section';
import { useSubscriptionManager } from '@/lib/hooks/useSubscriptionManager'; // Import the custom hook

export default function HomePage() {
  const { handleSubscribe, loadingPriceId } = useSubscriptionManager(); // Use the hook

  // The useUser() call is now inside useSubscriptionManager
  // The useState and useEffect for stripePromise are also inside the hook
  // The handleSubscribe function itself is now from the hook

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <SharedNavbar /> {/* Use the shared navbar component */}

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-12 sm:py-24 md:py-32 lg:py-48">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Optimize Your Routes, <span className="text-primary">Effortlessly</span>.
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl md:text-2xl">
                OptiRoutePro helps you find the best path for all your stops. Save time, fuel, and deliver more with our smart route optimization.
              </p>
              <div className="mt-10">
                <Link href="/dashboard">
                  <Button size="lg" className="group">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section (Placeholder) */}
        <section id="features" className="py-16 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose OptiRoutePro?</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center p-6 border rounded-lg shadow-sm">
                <MapPinned className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Smart Optimization</h3>
                <p className="text-muted-foreground">Advanced algorithms find the most efficient routes for multiple stops.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 border rounded-lg shadow-sm">
                <Users className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Easy Navigation</h3>
                <p className="text-muted-foreground">Seamlessly launch routes in Google Maps, Apple Maps, or Waze.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 border rounded-lg shadow-sm">
                <Gift className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Cost-Effective</h3>
                <p className="text-muted-foreground">Affordable plans and a free tier to get you started.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing">
          <PricingSection
            handleSubscribe={handleSubscribe}
            loadingPriceId={loadingPriceId}
          />
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="border rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-3">What is OptiRoutePro?</h3>
                <p className="text-muted-foreground">
                  OptiRoutePro is a route optimization tool that helps you find the most efficient path for multiple stops.
                  It's perfect for delivery drivers, sales representatives, service technicians, or anyone who needs to visit multiple locations efficiently.
                </p>
              </div>

              <div className="border rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-3">How does the free trial work?</h3>
                <p className="text-muted-foreground">
                  Our free trial gives you 7 days of access to either our Pro or Unlimited plan features.
                  You can cancel anytime during the trial period and won't be charged. After the trial ends,
                  you'll be automatically subscribed to the plan you selected.
                </p>
              </div>

              <div className="border rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-3">What's the difference between Pro and Unlimited plans?</h3>
                <p className="text-muted-foreground">
                  The Pro plan allows up to 30 optimizations per month with a maximum of 55 stops per route.
                  The Unlimited plan offers unlimited optimizations and stops per route, plus priority support and API access (coming soon).
                </p>
              </div>

              <div className="border rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Can I use OptiRoutePro on my mobile device?</h3>
                <p className="text-muted-foreground">
                  Yes! OptiRoutePro is designed to be mobile-friendly. You can optimize routes on your phone or tablet,
                  and easily navigate to each stop using your preferred navigation app (Google Maps, Apple Maps, or Waze).
                </p>
              </div>

              <div className="border rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-3">How do I cancel my subscription?</h3>
                <p className="text-muted-foreground">
                  You can cancel your subscription at any time from your account settings page.
                  After cancellation, you'll continue to have access to your plan until the end of your current billing period.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section id="support" className="py-16 bg-primary/10">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <Mail className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Need Help?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Our team is here to help you get the most out of OptiRoutePro. If you have any questions,
              feedback, or need assistance, please don't hesitate to reach out.
            </p>
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="font-medium">Contact us at:</p>
              <a href="mailto:help@optiroutepro.com" className="text-primary hover:underline font-medium">
                help@optiroutepro.com
              </a>
              <p className="text-sm text-muted-foreground mt-4">
                We typically respond within 24 hours on business days.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <SharedFooter />
    </div>
  );
}
