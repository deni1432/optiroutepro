'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Route, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a cn helper for classnames

interface MobileDashboardSidebarProps {
  activeView: 'optimization' | 'account';
  onViewChange: (view: 'optimization' | 'account') => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDashboardSidebar({ activeView, onViewChange, isOpen, onClose }: MobileDashboardSidebarProps) {
  // Prevent scrolling when the sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose} // Close sidebar when clicking overlay
      />

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 w-64 bg-gray-100 dark:bg-gray-800 p-4 flex flex-col z-50 transform transition-transform',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Dashboard Menu</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <nav className="flex flex-col space-y-2">
          <Button
            variant={activeView === 'optimization' ? 'secondary' : 'ghost'}
            className="justify-start"
            onClick={() => { onViewChange('optimization'); onClose(); }} // Close on selection
          >
            <Route className="mr-2 h-4 w-4" />
            Route Optimization
          </Button>
          <Button
            variant={activeView === 'account' ? 'secondary' : 'ghost'}
            className="justify-start"
            onClick={() => { onViewChange('account'); onClose(); }} // Close on selection
          >
            <Settings className="mr-2 h-4 w-4" />
            Account Settings
          </Button>
          {/* Add more navigation links here later if needed */}
        </nav>
      </div>
    </>
  );
}