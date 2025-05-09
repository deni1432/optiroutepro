'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPinned, Users, Gift } from 'lucide-react';
import Header from '@/components/header';
import PricingSection from '@/components/pricing-section';
import { useSubscriptionManager } from '@/lib/hooks/useSubscriptionManager'; // Import the custom hook

export default function HomePage() {
  const { handleSubscribe, loadingPriceId } = useSubscriptionManager(); // Use the hook

  // The useUser() call is now inside useSubscriptionManager
  // The useState and useEffect for stripePromise are also inside the hook
  // The handleSubscribe function itself is now from the hook

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <Header /> {/* Use the reusable Header component */}

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

        <PricingSection
          handleSubscribe={handleSubscribe}
          loadingPriceId={loadingPriceId}
        />

        {/* Referral Hook Section (Placeholder) */}
        <section id="referral" className="py-16 bg-primary/10">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <Gift className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Share OptiRoutePro, Get Rewarded!</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Love OptiRoutePro? Share it with your friends and colleagues. You'll both get a discount when they sign up!
            </p>
            <Button size="lg" variant="outline">Learn More About Referrals</Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} OptiRoutePro. All rights reserved.</p>
          <nav className="flex gap-4 mt-4 md:mt-0">
            <Link href="/terms" className="text-sm hover:underline">Terms of Service</Link>
            <Link href="/privacy" className="text-sm hover:underline">Privacy Policy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
