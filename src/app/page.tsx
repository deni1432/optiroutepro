'use client'; // Needs to be a client component to manage state for the menu

import { useState } from 'react'; // Import useState
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPinned, Users, Gift } from 'lucide-react';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import HamburgerToggle from '@/components/hamburger-toggle'; // Import the new component
import MobileMenu from '@/components/mobile-menu'; // Import MobileMenu

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Added mobile padding */}
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8"> {/* Added justify-between */}
          <Link href="/" className="flex items-center space-x-2"> {/* Removed mr-6 for better spacing with hamburger */}
            <MapPinned className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">OptiRoutePro</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex flex-1 items-center space-x-4 justify-end"> {/* Hidden on mobile, flex on lg */}
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/#pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
            </SignedOut>
          </nav>

          {/* Mobile Buttons (Sign In / Dashboard) and Hamburger Toggle */}
          <div className="lg:hidden"> {/* Wrapper for mobile toggle, removed flex and space-x-2 */}
            {/* Hamburger Menu Toggle */}
            <HamburgerToggle isOpen={isMobileMenuOpen} toggleMenu={toggleMobileMenu} />
          </div>
        </div>
      </header>
      <MobileMenu isOpen={isMobileMenuOpen} toggleMenu={toggleMobileMenu} isDashboard={false} />

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

        {/* Pricing Section (Placeholder) */}
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
                  <li>✓ Up to 5 stops per route</li>
                  <li>✓ 2 optimizations per day</li>
                  <li>✓ Basic map preview</li>
                </ul>
                <Button className="w-full" variant="outline">Get Started</Button>
              </div>
              {/* Pro Tier Card */}
              <div className="border-2 border-primary rounded-lg p-8 shadow-xl relative">
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold rounded-full">
                  Most Popular
                </div>
                <h3 className="text-2xl font-semibold mb-2">Pro</h3>
                <p className="text-4xl font-bold mb-4">$10<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
                <ul className="space-y-2 text-muted-foreground mb-6 text-left">
                  <li>✓ Up to 50 stops per route</li>
                  <li>✓ Unlimited optimizations</li>
                  <li>✓ Save & manage routes</li>
                  <li>✓ Priority support</li>
                </ul>
                <Button className="w-full">Choose Pro</Button>
              </div>
              {/* Business Tier Card (Placeholder) */}
              <div className="border rounded-lg p-8 shadow-lg">
                <h3 className="text-2xl font-semibold mb-2">Business</h3>
                <p className="text-4xl font-bold mb-4">$25<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
                <ul className="space-y-2 text-muted-foreground mb-6 text-left">
                  <li>✓ All Pro features</li>
                  <li>✓ Team accounts (soon)</li>
                  <li>✓ API access (soon)</li>
                </ul>
                <Button className="w-full" variant="outline">Contact Us</Button>
              </div>
            </div>
          </div>
        </section>

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
