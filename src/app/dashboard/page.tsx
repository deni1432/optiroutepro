'use client'; // This page now needs to be a client component to manage state

import { useEffect, useState } from 'react'; // For managing state
// import { currentUser } from '@clerk/nextjs/server'; // Cannot use server-side currentUser in client component
import { useUser, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'; // Use client-side hook and import auth components
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPinned } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import RouteForm from '@/components/route-form';
import OptimizedRouteList from '@/components/optimized-route-list'; // Import the new component
import HamburgerToggle from '@/components/hamburger-toggle'; // Import the new component
import dynamic from 'next/dynamic'; // Import dynamic for SSR control
import MobileMenu from '@/components/mobile-menu'; // Import MobileMenu

// Dynamically import the map component to ensure it only loads on the client side
const RouteMapPreview = dynamic(() => import('@/components/route-map-preview'), {
  ssr: false, // Disable server-side rendering for this component
});


// Define the structure for the new API response
interface OptimizedWaypointDetail {
  id: string;
  lat: number;
  lng: number;
}
interface OptimizedRouteSection { // This is a leg
  departure: { place: any; time: string; originalId?: string };
  arrival: { place: any; time: string; originalId?: string };
  summary: { duration: number; length: number };
  polyline: string;
  actions?: any[];
}

interface ApiOptimizedRouteResponse { // Matches backend and RouteForm
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
  // const user = await currentUser(); // Cannot use server-side
  const { user, isSignedIn, isLoaded } = useUser(); // Use client-side hook
  const [optimizedRouteData, setOptimizedRouteData] = useState<ApiOptimizedRouteResponse | null>(null); // Use new interface
  // Store the original points with their IDs and address values
  const [originalPoints, setOriginalPoints] = useState<OriginalPointData[]>([]);
  // This will store the addresses sorted according to the optimized route
  const [sortedOriginalAddresses, setSortedOriginalAddresses] = useState<string[]>([]);
  const [showRouteForm, setShowRouteForm] = useState(true); // To toggle form and results view
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu

  const toggleMobileMenu = () => { // Function to toggle mobile menu
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handle navigation modal for individual stops (placeholder)
  const handleNavigateStop = (waypointIndex: number) => { // Now receives waypointIndex
    if (optimizedRouteData && optimizedRouteData.optimizedWaypointDetails[waypointIndex]) {
      const waypoint = optimizedRouteData.optimizedWaypointDetails[waypointIndex];
      // For now, just log. Later, this will open the navigation modal.
      console.log('Navigate to waypoint:', waypoint, 'Original Address:', sortedOriginalAddresses[waypointIndex]);
      // TODO: Implement Navigation Modal
    }
  };
  
  // Effect to handle loading state for user
  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <p>Loading user information...</p>
        {/* You can add a spinner here */}
      </div>
    );
  }


  if (!isSignedIn) {
    // This case should ideally be handled by Clerk's middleware redirecting to sign-in
    // For now, providing a link to sign in.
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
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8"> {/* Added justify-between */}
          <Link href="/" className="flex items-center space-x-2"> {/* Removed mr-6 for better spacing with hamburger */}
            <MapPinned className="h-6 w-6 text-primary" />
            <span className="font-bold">OptiRoutePro Dashboard</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4"> {/* Hidden on mobile, flex on lg */}
            {user && <p className="text-sm text-muted-foreground">Welcome, {user.firstName || user.emailAddresses[0]?.emailAddress || 'User'}</p>}
            <UserButton afterSignOutUrl="/" />
          </nav>

         {/* Mobile Buttons (Sign In / Dashboard) and Hamburger Toggle */}
         <div className="lg:hidden"> {/* Wrapper for mobile toggle, removed flex and space-x-2 */}
           {/* Hamburger Menu Toggle */}
           <HamburgerToggle isOpen={isMobileMenuOpen} toggleMenu={toggleMobileMenu} />
         </div>
        </div>
      </header>
     <MobileMenu isOpen={isMobileMenuOpen} toggleMenu={toggleMobileMenu} isDashboard={true} />

      {/* Main Dashboard Content Area */}
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-6">Your Routes</h1>
          
          {/* Route Input Form and Optimized Route Display */}
          {showRouteForm ? (
            <section className="mb-8">
              <RouteForm
                onRouteOptimized={(data, receivedOriginalPoints) => {
                  setOptimizedRouteData(data);
                  setOriginalPoints(receivedOriginalPoints); // Store the original points with IDs

                  if (data && data.optimizedWaypointDetails && receivedOriginalPoints.length > 0) {
                    const originalPointsMap = new Map<string, string>();
                    receivedOriginalPoints.forEach(p => originalPointsMap.set(p.id, p.value));

                    const sortedAddrs = data.optimizedWaypointDetails.map(wpDetail => {
                      return originalPointsMap.get(wpDetail.id) || `Address for ID ${wpDetail.id}`; // Fallback
                    });
                    setSortedOriginalAddresses(sortedAddrs);
                    console.log("Sorted original addresses for display:", sortedAddrs);

                  } else {
                    setSortedOriginalAddresses([]);
                  }
                  if (data) setShowRouteForm(false); // Hide form, show results
                }}
              />
            </section>
          ) : (
            <section className="mb-8">
               <Button onClick={() => {
                setShowRouteForm(true);
                setOptimizedRouteData(null);
                setOriginalPoints([]);
                setSortedOriginalAddresses([]); // Clear both address states
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
                    originalAddresses={sortedOriginalAddresses} // Pass the correctly sorted addresses
                    onNavigateStop={handleNavigateStop}
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer (optional for dashboard) */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        OptiRoutePro &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}