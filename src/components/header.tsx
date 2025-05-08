'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPinned } from 'lucide-react';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import HamburgerToggle from '@/components/hamburger-toggle';
import MobileMenu from '@/components/mobile-menu';

// Optional: Add prop for current page to highlight active link if needed
// interface HeaderProps {
//   currentPage?: 'home' | 'dashboard' | 'pricing';
// }

export default function Header(/* { currentPage }: HeaderProps */) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Determine if the current context is the dashboard page - adjust logic if needed
  // This might be better handled by passing a prop if dashboard needs unique elements
  const isDashboardPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard');

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center space-x-2">
            <MapPinned className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">OptiRoutePro</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex flex-1 items-center space-x-4 justify-end">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/pricing">
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

          {/* Mobile Hamburger Toggle */}
          <div className="lg:hidden">
            <HamburgerToggle isOpen={isMobileMenuOpen} toggleMenu={toggleMobileMenu} />
          </div>
        </div>
      </header>
      {/* Mobile Menu - Rendered outside the header structure but controlled by its state */}
      <MobileMenu isOpen={isMobileMenuOpen} toggleMenu={toggleMobileMenu} isDashboard={isDashboardPage} />
    </>
  );
}