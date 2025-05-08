'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface HamburgerToggleProps {
  isOpen: boolean;
  toggleMenu: () => void;
}

export default function HamburgerToggle({ isOpen, toggleMenu }: HamburgerToggleProps) {
  const commonStyles = "h-0.5 w-6 bg-foreground rounded-full absolute"; // Removed transition-all and duration-300 from here
  const transitionProps = { duration: 0.15, ease: "linear" }; // 150ms = 0.15s

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-10 w-10 focus:outline-none lg:hidden" // Only visible on mobile (below lg breakpoint)
      onClick={toggleMenu}
      aria-label="Toggle menu"
    >
      <motion.span
        className={`${commonStyles} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
        animate={{ rotate: isOpen ? 45 : 0, y: isOpen ? 0 : -6 }}
        transition={transitionProps}
      />
      <motion.span
        className={`${commonStyles} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
        animate={{ opacity: isOpen ? 0 : 1 }}
        transition={{ duration: 0.075, ease: "linear" }} // Faster opacity transition for the middle bar
      />
      <motion.span
        className={`${commonStyles} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
        animate={{ rotate: isOpen ? -45 : 0, y: isOpen ? 0 : 6 }}
        transition={transitionProps}
      />
    </Button>
  );
}