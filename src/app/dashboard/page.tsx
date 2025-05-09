'use client';

import { useEffect, useState } from 'react';
import { useUser, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPinned, Menu } from 'lucide-react'; // Import Menu icon
import { UserButton } from '@clerk/nextjs'; // Re-import UserButton
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
import RouteForm from '@/components/route-form';
import OptimizedRouteList from '@/components/optimized-route-list';
import HamburgerToggle from '@/components/hamburger-toggle';
import dynamic from 'next/dynamic';
import MobileMenu from '@/components/mobile-menu';
import DashboardSidebar from '@/components/dashboard-sidebar'; // Import the sidebar
import AccountSettings from '@/components/account-settings'; // Import the account settings component
// Removed MobileDashboardSidebar import


// Dynamically import the map component to ensure it only loads on the client side
const RouteMapPreview = dynamic(() => import('@/components/route-map-preview'), {
  ssr: false,
});


// Define the structure for the new API response
interface OptimizedWaypointDetail {
  id: string;
  lat: number;
  lng: number;
}
interface OptimizedRouteSection {
  departure: { place: any; time: string; originalId?: string };
  arrival: { place: any; time: string; originalId?: string };
  summary: { duration: number; length: number };
  polyline: string;
  actions?: any[];
}

interface ApiOptimizedRouteResponse {
  optimizedWaypointDetails: OptimizedWaypointDetail[];
  routeSections: OptimizedRouteSection[];
  totalDuration: number;
  totalLength: number;
}

// For the data passed from RouteForm
interface OriginalPointData {
  id: string;
  value: string;
}

export default function DashboardPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [optimizedRouteData, setOptimizedRouteData] = useState<ApiOptimizedRouteResponse | null>(null);
  const [originalPoints, setOriginalPoints] = useState<OriginalPointData[]>([]);
  const [sortedOriginalAddresses, setSortedOriginalAddresses] = useState<string[]>([]);
  const [showRouteForm, setShowRouteForm] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for main mobile menu
  // Removed isMobileSidebarOpen state
  const [activeView, setActiveView] = useState<'optimization' | 'account'>('optimization'); // State for active view
  const searchParams = useSearchParams(); // Hook to access search parameters

  // Effect to read query parameter and update activeView
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'account') {
      setActiveView('account');
    } else if (viewParam === 'optimization') {
      setActiveView('optimization');
    }
    // If no viewParam, it defaults to 'optimization' as per initial state
  }, [searchParams]); // Re-run when searchParams change

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Removed toggleMobileSidebar function

  const handleNavigateStop = (waypointIndex: number) => {
    if (optimizedRouteData && optimizedRouteData.optimizedWaypointDetails[waypointIndex]) {
      const waypoint = optimizedRouteData.optimizedWaypointDetails[waypointIndex];
      console.log('Navigate to waypoint:', waypoint, 'Original Address:', sortedOriginalAddresses[waypointIndex]);
      // TODO: Implement Navigation Modal
    }
  };

  // Effect to handle loading state for user
  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <p>Loading user information...</p>
      </div>
    );
  }


  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
        <p className="mb-6 text-muted-foreground">You need to be signed in to view the dashboard.</p>
        <Link href="/sign-in">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center space-x-2">
            <MapPinned className="h-6 w-6 text-primary" />
            <span className="font-bold">OptiRoutePro Dashboard</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4">
            {user && <p className="text-sm text-muted-foreground">Welcome, {user.firstName || user.emailAddresses[0]?.emailAddress || 'User'}</p>}
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-10 h-10",
                  userButtonPopoverCard: "mt-2",
                }
              }}
            />
          </nav>

         {/* Mobile Buttons (Sign In / Dashboard) and Hamburger Toggle */}
         <div className="lg:hidden flex items-center space-x-2"> {/* Added flex and space-x-2 */}
            {/* Only Main Mobile Menu Toggle remains */}
            <HamburgerToggle isOpen={isMobileMenuOpen} toggleMenu={toggleMobileMenu} />
         </div>
       </div>
      </header>
     {/* Main Mobile Menu - Now includes dashboard links */}
     <MobileMenu isOpen={isMobileMenuOpen} toggleMenu={toggleMobileMenu} /> {/* isDashboard prop removed */}

     {/* Removed Mobile Dashboard Sidebar */}

       {/* Main Dashboard Content Area with Sidebar */}
       <div className="flex flex-1"> {/* Use flex to create sidebar and main content layout */}
         {/* Sidebar (Desktop) */}
         <div className="hidden lg:block">
            <DashboardSidebar activeView={activeView} onViewChange={setActiveView} />
         </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto"> {/* Add overflow-y-auto for scrolling */}
          <div className="container mx-auto">
            {activeView === 'optimization' ? (
              <>
                <h1 className="text-3xl font-bold mb-6">Your Routes</h1>
                {/* Route Input Form and Optimized Route Display */}
                {showRouteForm ? (
                  <section className="mb-8">
                    <RouteForm
                      onRouteOptimized={(data, receivedOriginalPoints) => {
                        setOptimizedRouteData(data);
                        setOriginalPoints(receivedOriginalPoints);

                        if (data && data.optimizedWaypointDetails && receivedOriginalPoints.length > 0) {
                          const originalPointsMap = new Map<string, string>();
                          receivedOriginalPoints.forEach(p => originalPointsMap.set(p.id, p.value));

                          const sortedAddrs = data.optimizedWaypointDetails.map(wpDetail => {
                            return originalPointsMap.get(wpDetail.id) || `Address for ID ${wpDetail.id}`;
                          });
                          setSortedOriginalAddresses(sortedAddrs);
                          console.log("Sorted original addresses for display:", sortedAddrs);

                        } else {
                          setSortedOriginalAddresses([]);
                        }
                        if (data) setShowRouteForm(false);
                      }}
                    />
                  </section>
                ) : (
                  <section className="mb-8">
                     <Button onClick={() => {
                      setShowRouteForm(true);
                      setOptimizedRouteData(null);
                      setOriginalPoints([]);
                      setSortedOriginalAddresses([]);
                    }} variant="outline" className="mb-4">
                      Plan New Route
                    </Button>
                    {/* Optimized Route List */}
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        {/* Map Preview */}
                        {optimizedRouteData && optimizedRouteData.routeSections && optimizedRouteData.optimizedWaypointDetails && (
                          <RouteMapPreview
                            routeSections={optimizedRouteData.routeSections}
                            optimizedWaypointDetails={optimizedRouteData.optimizedWaypointDetails}
                          />
                        )}
                        {/* Placeholder if map data is not available */}
                        {(!optimizedRouteData || !optimizedRouteData.routeSections || !optimizedRouteData.optimizedWaypointDetails) && (
                           <div className="p-6 border rounded-lg shadow-sm bg-card min-h-[300px] flex items-center justify-center">
                             <p className="text-muted-foreground">Map preview will be here...</p>
                           </div>
                        )}
                      </div>
                      <div>
                        <OptimizedRouteList
                          routeData={optimizedRouteData}
                          originalAddresses={sortedOriginalAddresses}
                          onNavigateStop={handleNavigateStop}
                        />
                      </div>
                    </div>
                  </section>
                )}
              </>
            ) : (
              // Account Settings View
              <AccountSettings />
            )}
          </div>
        </main>
      </div>


      {/* Footer (optional for dashboard) */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        OptiRoutePro &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}