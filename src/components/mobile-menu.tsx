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
              <Link href="/pricing" className={linkProps} onClick={toggleMenu}>
                Pricing
              </Link>
              {/* Common auth links/buttons */}
              <div className="mt-auto p-4 border-t">
                <SignedIn>
                  {/* Make the entire row clickable to open UserButton modal */}
                  {/* Use flex items-center and space-x-2 for layout */}
                  {/* Make the entire row clickable to open UserButton modal */}
                  {/* Use flex items-center and space-x-2 for layout */}
                  <div
                    className="flex items-center space-x-2 py-3 px-4 hover:bg-accent cursor-pointer" // Added space-x-2, hover effect, and cursor
                    onClick={() => {
                      // Find the UserButton element and trigger its click
                      // Use a more specific selector if needed, but .cl-userButton is standard
                      const userButton = document.querySelector('.cl-userButton');
                      if (userButton instanceof HTMLElement) {
                        userButton.click();
                      }
                      toggleMenu(); // Close the mobile menu after clicking
                    }}
                  >
                    {/* UserButton on the left - Fine-tune vertical alignment */}
                    {/* Add a small top margin to nudge the icon down */}
                    <div className="flex items-center mt-0.5"> {/* Added mt-0.5 */}
                      <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-6 h-6" } }} /> {/* Adjusted size */}
                    </div>
                    {/* Account text on the right - Ensure it's vertically centered */}
                    <span className="flex items-center">Account</span> {/* Wrap text to ensure it's flex-aligned */}
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