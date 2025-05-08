'use client'; // Needs to be a client component to manage state for the menu

import { useState } from 'react'; // Still needed for loadingPriceId
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPinned, Users, Gift } from 'lucide-react'; // MapPinned needed for Header import below? No, Header imports it.
import { useUser } from '@clerk/nextjs'; // Keep useUser for handleSubscribe logic
import Header from '@/components/header'; // Import the new Header component
import PricingSection from '@/components/pricing-section'; // Import PricingSection

export default function HomePage() {
  // Mobile menu state is now managed within Header component
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null); // For loading state of subscribe buttons
  const { isSignedIn, user, isLoaded } = useUser(); // Keep for handleSubscribe and potentially PricingSection props if needed

  // toggleMobileMenu is no longer needed here

  const handleSubscribe = async (priceId: string) => {
    if (!isSignedIn) {
      // If not signed in, redirect to sign-in page with the priceId as a query parameter
      window.location.href = `/sign-in?priceId=${priceId}`;
      return; // Stop further execution
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

      const { sessionId, url } = await response.json();
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
