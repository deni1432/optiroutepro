'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Route, Settings } from 'lucide-react';

interface DashboardSidebarProps {
  activeView: 'optimization' | 'account';
  onViewChange: (view: 'optimization' | 'account') => void;
}

export default function DashboardSidebar({ activeView, onViewChange }: DashboardSidebarProps) {
  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 p-4 flex flex-col">
      <h2 className="text-xl font-semibold mb-6">Dashboard</h2>
      <nav className="flex flex-col space-y-2">
        <Button
          variant={activeView === 'optimization' ? 'secondary' : 'ghost'}
          className="justify-start hover:bg-accent cursor-pointer transition-colors"
          onClick={() => onViewChange('optimization')}
        >
          <Route className="mr-2 h-4 w-4" />
          Route Optimization
        </Button>
        <Button
          variant={activeView === 'account' ? 'secondary' : 'ghost'}
          className="justify-start hover:bg-accent cursor-pointer transition-colors"
          onClick={() => onViewChange('account')}
        >
          <Settings className="mr-2 h-4 w-4" />
          Account Settings
        </Button>
        {/* Add more navigation links here later if needed */}
      </nav>
    </div>
  );
}