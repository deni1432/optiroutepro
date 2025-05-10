'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPinned } from 'lucide-react';
import { UserButton, SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';
import HamburgerToggle from '@/components/hamburger-toggle';
import MobileMenu from '@/components/mobile-menu';

export default function SharedNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center space-x-2">
            <MapPinned className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">OptiRoutePro</span>
          </Link>

          {/* Desktop Navigation - visible at 1024px (lg breakpoint) and above */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link href="/#features">
              <Button variant="ghost">Features</Button>
            </Link>
            <Link href="/#pricing">
              <Button variant="ghost">Price</Button>
            </Link>
            <Link href="/#faq">
              <Button variant="ghost">FAQ</Button>
            </Link>
            <Link href="/#support">
              <Button variant="ghost">Support</Button>
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <SignedIn>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-10 h-10",
                    userButtonPopoverCard: "mt-2",
                  }
                }}
              />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="default">Sign Up</Button>
              </SignUpButton>
            </SignedOut>
          </div>

          {/* Mobile Hamburger Toggle - hidden on screens larger than lg (1024px) */}
          <div className="lg:hidden">
            <HamburgerToggle isOpen={isMobileMenuOpen} toggleMenu={toggleMobileMenu} />
          </div>
        </div>
      </header>
      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} toggleMenu={toggleMobileMenu} />
    </>
  );
}
