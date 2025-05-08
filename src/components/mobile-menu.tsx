'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { X } from 'lucide-react'; // For a close button inside the menu

interface MobileMenuProps {
  isOpen: boolean;
  toggleMenu: () => void;
  isDashboard: boolean; // To conditionally render dashboard-specific items
}

export default function MobileMenu({ isOpen, toggleMenu, isDashboard }: MobileMenuProps) {
  const menuVariants = {
    hidden: { x: '100%' },
    visible: { x: 0 },
  };

  const linkProps = "block py-3 px-4 text-lg hover:bg-accent";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm lg:hidden"
          onClick={toggleMenu} // Close menu if overlay is clicked
        >
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-xs bg-background shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the menu
          >
            <div className="flex justify-end p-4">
              <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Close menu">
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="flex-grow py-4">
              {/* Always show Dashboard and Pricing links for now */}
              <Link href="/dashboard" className={linkProps} onClick={toggleMenu}>
                Dashboard
              </Link>
              <Link href="/#pricing" className={linkProps} onClick={toggleMenu}>
                Pricing
              </Link>
              {/* Common auth links/buttons */}
              <div className="mt-auto p-4 border-t">
                <SignedIn>
                  <div className="flex items-center justify-between">
                    <span>Account</span>
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
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