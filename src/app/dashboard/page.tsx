'use client';

import { useEffect, useState, Suspense } from 'react';
import { useUser, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import RouteForm from '@/components/route-form';
import OptimizedRouteList from '@/components/optimized-route-list';
import dynamic from 'next/dynamic';
import DashboardSidebar from '@/components/dashboard-sidebar';
import AccountSettings from '@/components/account-settings';
import SharedNavbar from '@/components/shared-navbar';


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

// Create a wrapper component that uses searchParams
function DashboardContent() {
  const { isSignedIn, isLoaded } = useUser();
  const [optimizedRouteData, setOptimizedRouteData] = useState<ApiOptimizedRouteResponse | null>(null);
  const [originalPoints, setOriginalPoints] = useState<OriginalPointData[]>([]);
  const [sortedOriginalAddresses, setSortedOriginalAddresses] = useState<string[]>([]);
  const [showRouteForm, setShowRouteForm] = useState(true);
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

  // Removed toggleMobileSidebar function

  const handleNavigateStop = (waypointIndex: number, address: string) => {
    if (optimizedRouteData && optimizedRouteData.optimizedWaypointDetails[waypointIndex]) {
      const waypoint = optimizedRouteData.optimizedWaypointDetails[waypointIndex];
      console.log('Navigate to waypoint:', waypoint, 'Original Address:', address);

      // Get coordinates for the destination
      const lat = waypoint.lat;
      const lng = waypoint.lng;

      // Open in the user's default maps app with the specific destination coordinates
      // This will work on both iOS and Android
      window.open(`https://maps.google.com/maps?q=${lat},${lng}`);
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
      {/* Use the shared navbar component */}
      <SharedNavbar />

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

// Main component that wraps the content in a Suspense boundary
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}