'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, Navigation, Clock, Milestone } from 'lucide-react';

// From HERE API (Place can be complex, simplified here)
interface Place {
  type: string;
  location: {
    lat: number;
    lng: number;
  };
  originalLocation?: {
    lat: number;
    lng: number;
  };
}

// Matches the structure from /api/optimize-route for a leg of the journey
interface OptimizedRouteSection {
  departure: { place: Place; time: string; originalId?: string };
  arrival: { place: Place; time: string; originalId?: string };
  summary: { duration: number; length: number };
  polyline: string;
  actions?: Array<{ instruction: string; duration: number; length: number }>;
}

// Matches the structure from /api/optimize-route for a waypoint in the optimized sequence
interface OptimizedWaypointDetail {
  id: string; // Our original ID (origin, destination, via-N, or stop.id)
  lat: number;
  lng: number;
}

// Props for this component, matching ApiOptimizedRouteResponse from DashboardPage
interface OptimizedRouteListProps {
  routeData: {
    optimizedWaypointDetails: OptimizedWaypointDetail[];
    routeSections: OptimizedRouteSection[];
    totalDuration: number;
    totalLength: number;
  } | null;
  originalAddresses: string[]; // Array of original address strings
  onNavigateStop: (waypointIndex: number) => void;
}

const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  let formatted = '';
  if (hours > 0) {
    formatted += `${hours}h `;
  }
  if (minutes > 0 || hours === 0) {
    formatted += `${minutes}min`; // Shorten minutes
  }
  return formatted.trim() || '0min'; // Handle case where duration is 0
};

const formatDistance = (meters: number): string => {
  const miles = meters * 0.000621371; // Convert meters to miles
  return `${miles.toFixed(1)} miles`; // Use miles
};

export default function OptimizedRouteList({ routeData, originalAddresses, onNavigateStop }: OptimizedRouteListProps) {
  if (!routeData || !routeData.optimizedWaypointDetails || routeData.optimizedWaypointDetails.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ListChecks className="mr-2 h-6 w-6 text-primary" />
            Optimized Route
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Enter your locations and click "Optimize Route" to see your journey plan here.</p>
        </CardContent>
      </Card>
    );
  }

  // This is a temporary, simplified way to map original addresses.
  // It assumes originalAddresses is passed in the *optimized* order.
  // A more robust solution would involve mapping by ID if originalAddresses retains its input order.
  const getDisplayAddress = (waypoint: OptimizedWaypointDetail, index: number): string => {
    if (originalAddresses && originalAddresses[index]) {
      return originalAddresses[index];
    }
    return `Lat: ${waypoint.lat.toFixed(4)}, Lng: ${waypoint.lng.toFixed(4)}`;
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <ListChecks className="mr-2 h-6 w-6 text-primary" />
            Your Optimized Route
          </div>
          <div className="text-sm text-muted-foreground font-normal">
            Total: {formatDuration(routeData.totalDuration)} / {formatDistance(routeData.totalLength)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {routeData.optimizedWaypointDetails.map((waypoint, waypointIndex) => {
            const isLastWaypoint = waypointIndex === routeData.optimizedWaypointDetails.length - 1;
            const legToNextStop = !isLastWaypoint ? routeData.routeSections[waypointIndex] : null;
            
            let label = '';
            if (waypoint.id === 'origin') { // Check against ID passed to findsequence
              label = 'Starting point'; // Changed label
            } else if (waypoint.id === 'destination') {
              label = 'Ending point'; // Changed label
            } else {
              // For via stops, we need a way to count them in the optimized sequence.
              // This simple count assumes 'origin' and 'destination' IDs are unique.
              const viaStopNumber = routeData.optimizedWaypointDetails
                .slice(0, waypointIndex)
                .filter(wp => wp.id !== 'origin' && wp.id !== 'destination').length + 1;
              label = `Stop ${viaStopNumber}`; // Simplified label
            }
            // If it's the last item in the optimized list, and its ID is not 'origin', it's the destination.
            if (isLastWaypoint && waypoint.id !== 'origin') {
                label = 'Ending point'; // Changed label
            }


            // Arrival time: For stops after origin, use the arrival time of the *previous* section (leg)
            // Or, more directly, the HERE API's findsequence might return estimated arrival/departure per waypoint.
            // For now, we use section data. The arrival at waypoint `i` is the arrival of section `i-1`.
            const arrivalSection = waypointIndex > 0 ? routeData.routeSections[waypointIndex - 1] : null;
            const departureSection = routeData.routeSections[waypointIndex]; // For departure time of origin


            return (
              <li key={waypoint.id || `waypoint-${waypointIndex}`} className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    {/* Address on top, bold */}
                    <p className="font-semibold text-lg">{getDisplayAddress(waypoint, waypointIndex)}</p>
                    {/* Label below, smaller and muted */}
                    <h3 className="text-sm text-muted-foreground">{label}</h3>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onNavigateStop(waypointIndex)} className="group">
                    Navigate
                    <Navigation className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>
                
                {/* Arrival Time */}
                {arrivalSection && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <Clock className="mr-1.5 h-3 w-3" />
                    Arrival: {arrivalSection.arrival.time ? new Date(arrivalSection.arrival.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    {/* Log raw time for debugging: console.log('Raw arrival time:', arrivalSection.arrival.time) */}
                  </p>
                )}
                 {/* Departure Time for Origin */}
                {waypointIndex === 0 && departureSection && (
                     <p className="text-xs text-muted-foreground mt-1 flex items-center">
                        <Clock className="mr-1.5 h-3 w-3" />
                        Departure: {departureSection.departure.time ? new Date(departureSection.departure.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        {/* Log raw time for debugging: console.log('Raw departure time:', departureSection.departure.time) */}
                    </p>
                )}

                {/* Leg details to next stop */}
                {legToNextStop && (
                  <div className="mt-2 pt-2 border-t border-dashed">
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Milestone className="mr-1.5 h-3 w-3" />
                      To next stop: {formatDuration(legToNextStop.summary.duration)} / {formatDistance(legToNextStop.summary.length)}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}