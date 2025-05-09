'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';
import { X } from 'lucide-react';

import { Route, Settings } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  toggleMenu: () => void;
  // isDashboard prop removed
}

export default function MobileMenu({ isOpen, toggleMenu }: MobileMenuProps) {
  const menuVariants = {
    hidden: { x: '100%' },
    visible: { x: 0 },
  };

  const linkProps = "block py-3 px-4 text-lg hover:bg-accent";
  // dashboardLinkProps will now use linkProps styling, but with flex for icon alignment
  const dashboardLinkStyle = `${linkProps} flex items-center`;

  const { user, isSignedIn, isLoaded } = useUser();
  const hasActiveSubscription = isLoaded && isSignedIn ? user?.publicMetadata?.hasActiveSubscription === true : false;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm lg:hidden" // Increased z-index
          onClick={toggleMenu}
        >
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-xs bg-background shadow-xl flex flex-col z-[70]" // Ensure inner content is also high
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-4">
              <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Close menu">
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="flex-grow py-4">
              {/* Standard Navigation Links */}
              <Link href="/dashboard" className={linkProps} onClick={toggleMenu}>
                Dashboard
              </Link>
              <Link href="/pricing" className={linkProps} onClick={toggleMenu}>
                Pricing
              </Link>

              {/* Dashboard Specific Links (Visible for SignedIn users with active subscription) */}
              {isSignedIn && hasActiveSubscription && (
                <>
                  <div className="border-t my-4 mx-4" /> {/* Divider */}
                  <h3 className="text-sm font-semibold text-muted-foreground px-4 mb-2">Dashboard</h3>
                  {/* Links navigate to dashboard with query param */}
                  <Link href="/dashboard?view=optimization" className={dashboardLinkStyle} onClick={toggleMenu}>
                    <Route className="mr-2 h-5 w-5" /> {/* Adjusted icon size */}
                    Route Optimization
                  </Link>
                  <Link href="/dashboard?view=account" className={dashboardLinkStyle} onClick={toggleMenu}>
                    <Settings className="mr-2 h-5 w-5" /> {/* Adjusted icon size */}
                    Account Settings
                  </Link>
                </>
              )}

              {/* Common auth links/buttons */}
              {/* This section now only contains SignInButton */}
              <div className="mt-auto p-4 border-t">
                {/* Removed SignedIn block with UserButton */}
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button className="w-full">Sign In</Button>
                  </SignInButton>
                </SignedOut>
              </div>
            </nav>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}