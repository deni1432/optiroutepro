'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPinned, Menu } from 'lucide-react';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'; // Re-import UserButton
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

  // isDashboardPage logic is no longer needed here as MobileMenu handles it internally
  // const isDashboardPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard');


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
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-10 h-10", // Slightly larger for a button feel
                    userButtonPopoverCard: "mt-2",
                  }
                }}
              />
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
      {/* isDashboard prop is removed as MobileMenu now checks user status internally */}
      <MobileMenu isOpen={isMobileMenuOpen} toggleMenu={toggleMobileMenu} />

      {/* Pending Payment Banner has been removed as payment confirmation is handled by Stripe hosted invoice page */}
    </>
  );
}