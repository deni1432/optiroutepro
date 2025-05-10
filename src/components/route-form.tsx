'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, XCircle, MapPin, Navigation } from 'lucide-react';

interface Stop {
  id: string;
  value: string;
  lat?: number;
  lng?: number;
  error?: string; // To store geocoding errors per stop
}

interface GeocodedWaypoint {
  lat: number;
  lng: number;
  id?: string;
}

interface OptimizedRouteSection { // This represents a leg of the journey
  departure: { place: any; time: string; originalId?: string };
  arrival: { place: any; time: string; originalId?: string };
  summary: { duration: number; length: number };
  polyline: string;
  actions?: any[];
}

// This is the structure expected by the onRouteOptimized callback,
// matching the backend's /api/optimize-route response.
interface ApiOptimizedRouteResponse {
  optimizedWaypointDetails: Array<{ id: string; lat: number; lng: number; }>;
  routeSections: OptimizedRouteSection[]; // OptimizedRouteSection is defined above
  totalDuration: number;
  totalLength: number;
}

// Define the structure for the original points data to be passed up
interface OriginalPointData {
  id: string; // 'origin', 'destination', or stop.id
  value: string; // The address string
}

interface RouteFormProps {
  // Ensure this uses the correct, single definition for the callback
  onRouteOptimized: (data: ApiOptimizedRouteResponse | null, originalPoints: OriginalPointData[]) => void;
  // We might also want a prop to clear the route if the form is reset or inputs change significantly
  // onClearRoute: () => void;
}

export default function RouteForm({ onRouteOptimized }: RouteFormProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState(''); // New state for destination
  const [stops, setStops] = useState<Stop[]>([]); // Initialize with no via stops by default
  const [isLoading, setIsLoading] = useState(false); // For route optimization
  const [isLocating, setIsLocating] = useState(false); // For geolocation/reverse geocoding
  const [error, setError] = useState<string | null>(null);
  // const [optimizedRouteData, setOptimizedRouteData] = useState<OptimizedRouteResponse | null>(null);
  // This state will now be managed by the parent (DashboardPage)


  // Helper function to geocode a single address
  const geocodeAddress = async (address: string): Promise<GeocodedWaypoint | { error: string }> => {
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || `Failed to geocode: ${address}` };
      }
      return { lat: data.lat, lng: data.lng };
    } catch (err) {
      console.error('Geocoding fetch error:', err);
      return { error: `Network error geocoding: ${address}` };
    }
  };

  const handleAddStop = () => {
    // Max 48 via stops + origin + destination = 50 total points
    if (stops.length < 48) {
      setStops([...stops, { id: crypto.randomUUID(), value: '' }]);
    }
  };

  const handleRemoveStop = (id: string) => {
    setStops(stops.filter(stop => stop.id !== id));
  };

  const handleStopChange = (id: string, value: string) => {
    setStops(stops.map(stop => (stop.id === id ? { ...stop, value } : stop)));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const emptyOriginalPoints: OriginalPointData[] = [];
    onRouteOptimized(null, emptyOriginalPoints); // Clear previous data in parent via callback


    // 1. Geocode Origin
    if (!origin) {
        setError('Origin address is required.');
        setIsLoading(false);
        return;
    }
    const originGeocoded = await geocodeAddress(origin);
    if ('error' in originGeocoded) {
      setError(`Origin geocoding failed: ${originGeocoded.error}`);
      setIsLoading(false);
      return;
    }

    // 2. Geocode Destination
    if (!destination) {
        setError('Destination address is required.');
        setIsLoading(false);
        return;
    }
    const destinationGeocoded = await geocodeAddress(destination);
    if ('error' in destinationGeocoded) {
        setError(`Destination geocoding failed: ${destinationGeocoded.error}`);
        setIsLoading(false);
        return;
    }

    // 3. Geocode Via Stops (if any)
    let validGeocodedViaStops: (Stop & GeocodedWaypoint)[] = [];
    if (stops.length > 0) {
        const geocodedViaStopsPromises = stops.map(async (stop) => {
            if (!stop.value.trim()) return { ...stop, error: "Empty via stop address."}; // Skip empty via stops silently or handle as error
            const result = await geocodeAddress(stop.value);
            if ('error' in result) {
            return { ...stop, error: result.error };
            }
            return { ...stop, lat: result.lat, lng: result.lng, error: undefined };
        });

        const geocodedViaStopsResults = await Promise.all(geocodedViaStopsPromises);
        
        const viaStopsWithErrors = geocodedViaStopsResults.filter(s => s.error);
        if (viaStopsWithErrors.length > 0) {
            setError(`Failed to geocode ${viaStopsWithErrors.length} via stop(s). First error: ${viaStopsWithErrors[0].error}`);
            setStops(geocodedViaStopsResults); // Update stops to show errors
            setIsLoading(false);
            return;
        }
        validGeocodedViaStops = geocodedViaStopsResults.filter(s => s.lat !== undefined && s.lng !== undefined) as (Stop & GeocodedWaypoint)[];
    }
    
    // 4. Call Optimize Route API
    try {
      const payload = {
        origin: { lat: originGeocoded.lat, lng: originGeocoded.lng, id: 'origin' }, // Add id
        destination: { lat: destinationGeocoded.lat, lng: destinationGeocoded.lng, id: 'destination' }, // Add id
        viaStops: validGeocodedViaStops.map(s => ({ lat: s.lat!, lng: s.lng!, id: s.id })),
      };
      
      const response = await fetch('/api/optimize-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to optimize route.');
        setIsLoading(false);
        return;
      }
      
      // Prepare original points data with their IDs
      const originalPoints: OriginalPointData[] = [
        { id: 'origin', value: origin },
        ...validGeocodedViaStops.map(s => ({ id: s.id, value: s.value })),
        { id: 'destination', value: destination },
      ];
      
      onRouteOptimized(data, originalPoints); // Pass data and original points to parent
      console.log('Optimized Route Data (from RouteForm):', data);
      console.log('Original Points Data (from RouteForm):', originalPoints);
    } catch (err) {
      console.error('Optimize route fetch error:', err);
      setError('Network error during route optimization.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="mr-2 h-6 w-6 text-primary" />
          Plan Your Route
        </CardTitle>
        <CardDescription>Enter your origin, destination, and any via stops to optimize your journey.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Origin Input with Geolocation Button */}
          <div>
            <label htmlFor="origin" className="block text-sm font-medium text-foreground mb-1">
              Origin
            </label>
            <div className="flex flex-col space-y-2"> {/* Changed to flex-col with space-y-2 */}
              <Input
                id="origin"
                type="text" // Corrected: Ensure only one type="text"
                placeholder="Enter starting address"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                required
                className="w-full" // Input takes full width of flex container
              />
              {/* Use Current Location Button */}
              <Button
                type="button"
                variant="outline"
                // Removed size="icon"
                onClick={() => {
                  if (navigator.geolocation) {
                    setIsLocating(true); // Indicate locating
                    setError(null); // Clear previous errors
                    navigator.geolocation.getCurrentPosition(
                      async (position) => { // Use async here
                        const { latitude, longitude } = position.coords;
                        
                        try {
                          // Call the new reverse geocoding API
                          const response = await fetch('/api/reverse-geocode', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ lat: latitude, lng: longitude }),
                          });
                          const data = await response.json();

                          if (response.ok && data.address) {
                            setOrigin(data.address); // Set input value to the address
                          } else {
                            console.error('Reverse geocoding failed:', data.error || data.message);
                            setError(data.error || 'Failed to get address for your location.');
                            // Optionally set coordinates if address not found but location obtained
                            // setOrigin(`${latitude},${longitude}`);
                          }
                        } catch (reverseGeocodeError) {
                          console.error('Reverse geocoding fetch error:', reverseGeocodeError);
                          setError('Network error during reverse geocoding.');
                          // Optionally set coordinates on network error
                          // setOrigin(`${latitude},${longitude}`);
                        } finally {
                          setIsLocating(false); // End locating
                        }
                      },
                      (error) => {
                        console.error('Geolocation error:', error);
                        setError('Unable to retrieve your location.');
                        setIsLocating(false); // End locating
                      }
                    );
                  } else {
                    setError('Geolocation is not supported by your browser.');
                  }
                }}
                aria-label="Use current location"
                disabled={isLocating || isLoading} // Disable while locating or optimizing
              >
                {isLocating ? (
                   <span className="flex items-center"> {/* Wrap content in a span for flex */}
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> {/* Adjusted margin */}
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Locating...
                   </span>
                ) : (
                  <span className="flex items-center"> {/* Wrap content in a span for flex */}
                    <MapPin className="mr-2 h-5 w-5" /> {/* Added margin */}
                    Use my current location
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Via Stops Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-foreground">
              Via Stops (Optional)
            </label>
            {stops.map((stop, index) => (
              <div key={stop.id} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-8 text-right">{index + 1}.</span>
                <Input
                  type="text"
                  placeholder={`Enter via stop ${index + 1} address`}
                  value={stop.value}
                  onChange={(e) => handleStopChange(stop.id, e.target.value)}
                  // Not required, as via stops are optional
                  className="flex-grow"
                />
                <Button // Always show remove button for via stops
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStop(stop.id)}
                    aria-label="Remove via stop"
                >
                    <XCircle className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            ))}
            {stops.length < 48 && ( // Max 48 via stops
              <Button
                type="button"
                variant="outline"
                onClick={handleAddStop}
                className="w-full group"
              >
                <PlusCircle className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Add Via Stop
              </Button>
            )}
          </div>
          
          {/* Destination Input */}
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-foreground mb-1">
              Destination
            </label>
            <Input
              id="destination"
              type="text"
              placeholder="Enter final destination address"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              className="w-full"
            />
          </div>
          
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>
          )}
          {/* Added margin-top for spacing */}
          <div className="mt-6">
            {/* The button is inside CardFooter, which already has padding.
                Adding margin-top to a div wrapping the button provides extra space. */}
          </div>

        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full group" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Optimizing...
              </span>
            ) : (
              <span className="flex items-center">
                <Navigation className="mr-2 h-5 w-5 transition-transform group-hover:rotate-[15deg]" />
                Optimize Route
              </span>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}