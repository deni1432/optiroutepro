'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { UserButton, SignedIn, SignedOut, SignInButton, SignUpButton, useUser } from '@clerk/nextjs';
import { X, Route, Settings, Mail } from 'lucide-react';

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
          className="fixed inset-0 z-[1000] bg-background/95 backdrop-blur-sm lg:hidden" // Significantly increased z-index to be above map
          onClick={toggleMenu}
        >
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-xs bg-background shadow-xl flex flex-col z-[1100]" // Increased z-index to be above the backdrop
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-4">
              <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Close menu">
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="flex-grow py-4">
              {/* Main Navigation Links */}
              <Link href="/" className={linkProps} onClick={toggleMenu}>
                Home
              </Link>
              <Link href="/#features" className={linkProps} onClick={toggleMenu}>
                Features
              </Link>
              <Link href="/#pricing" className={linkProps} onClick={toggleMenu}>
                Price
              </Link>
              <Link href="/#faq" className={linkProps} onClick={toggleMenu}>
                FAQ
              </Link>
              <Link href="/#support" className={linkProps} onClick={toggleMenu}>
                Support
              </Link>

              {/* Dashboard Links (Visible for SignedIn users) */}
              <SignedIn>
                <div className="border-t my-4 mx-4" /> {/* Divider */}
                <h3 className="text-sm font-semibold text-muted-foreground px-4 mb-2">Dashboard</h3>
                {hasActiveSubscription ? (
                  <>
                    <Link href="/dashboard?view=optimization" className={dashboardLinkStyle} onClick={toggleMenu}>
                      <Route className="mr-2 h-5 w-5" />
                      Route Optimization
                    </Link>
                    <Link href="/dashboard?view=account" className={dashboardLinkStyle} onClick={toggleMenu}>
                      <Settings className="mr-2 h-5 w-5" />
                      Account Settings
                    </Link>
                  </>
                ) : (
                  <Link href="/dashboard" className={dashboardLinkStyle} onClick={toggleMenu}>
                    <Route className="mr-2 h-5 w-5" />
                    Dashboard
                  </Link>
                )}
              </SignedIn>

              {/* Auth Buttons */}
              <div className="mt-auto p-4 border-t">
                <SignedIn>
                  <div className="p-2">
                    <UserButton
                      appearance={{
                        elements: {
                          userButtonAvatarBox: "w-10 h-10",
                        }
                      }}
                    />
                  </div>
                </SignedIn>
                <SignedOut>
                  <div className="flex flex-col space-y-2">
                    <SignInButton mode="modal">
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button className="w-full">Sign Up</Button>
                    </SignUpButton>
                  </div>
                </SignedOut>
              </div>
            </nav>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}