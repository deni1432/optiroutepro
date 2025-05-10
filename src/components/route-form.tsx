'use client';

import { useState, useEffect, useCallback } from 'react';
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

// Debounce function to delay input processing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Client-side cache for geocoded addresses
// This will persist during the session but will be cleared on page refresh
const geocodeCache: Record<string, { lat: number; lng: number; timestamp: number }> = {};

// Function to normalize addresses for consistent caching
function normalizeAddress(address: string): string {
  return address.toLowerCase().trim();
}

// Debounced function to save geocache to localStorage
let saveTimeout: NodeJS.Timeout | null = null;
function saveGeocacheToLocalStorage() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem('geocodeCache', JSON.stringify(geocodeCache));
      console.log('Saved geocode cache to localStorage');
    } catch (err) {
      console.warn('Failed to save geocode cache to localStorage:', err);
    }
  }, 1000); // Wait 1 second after the last call before saving
}

export default function RouteForm({ onRouteOptimized }: RouteFormProps) {
  // Input states
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [stops, setStops] = useState<Stop[]>([]); // Initialize with no via stops by default

  // Debounced values (to avoid triggering geocoding on every keystroke)
  const debouncedOrigin = useDebounce(origin, 500);
  const debouncedDestination = useDebounce(destination, 500);
  const debouncedStops = useDebounce(stops, 500);

  // UI states
  const [isLoading, setIsLoading] = useState(false); // For route optimization
  const [isLocating, setIsLocating] = useState(false); // For geolocation/reverse geocoding
  const [error, setError] = useState<string | null>(null);

  // Initialize cache from localStorage on component mount
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem('geocodeCache');
      if (cachedData) {
        const parsedCache = JSON.parse(cachedData);

        // Filter out expired entries (older than 7 days)
        const now = Date.now();
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

        Object.entries(parsedCache).forEach(([key, value]: [string, any]) => {
          if (value.timestamp && now - value.timestamp < sevenDaysInMs) {
            geocodeCache[key] = value;
          }
        });

        console.log(`Loaded ${Object.keys(geocodeCache).length} cached geocode entries`);
      }
    } catch (err) {
      console.error('Error loading geocode cache from localStorage:', err);
    }
  }, []);
  // const [optimizedRouteData, setOptimizedRouteData] = useState<OptimizedRouteResponse | null>(null);
  // This state will now be managed by the parent (DashboardPage)


  // Helper function to geocode a single address with caching
  const geocodeAddress = async (address: string): Promise<GeocodedWaypoint | { error: string }> => {
    try {
      // Normalize the address for consistent caching
      const normalizedAddress = normalizeAddress(address);

      // Check if the address is in the cache and not expired (7 days)
      const cachedResult = geocodeCache[normalizedAddress];
      if (cachedResult) {
        const now = Date.now();
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

        if (now - cachedResult.timestamp < sevenDaysInMs) {
          console.log(`Using cached geocode for: ${normalizedAddress}`);
          return { lat: cachedResult.lat, lng: cachedResult.lng };
        }
      }

      // If not in cache or expired, fetch from API
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || `Failed to geocode: ${address}` };
      }

      // Cache the result
      const result = { lat: data.lat, lng: data.lng };
      geocodeCache[normalizedAddress] = { ...result, timestamp: Date.now() };

      // Use a debounced save to localStorage to avoid too many writes
      saveGeocacheToLocalStorage();

      return result;
    } catch (err) {
      console.error('Geocoding fetch error:', err);
      return { error: `Network error geocoding: ${address}` };
    }
  };

  // Helper function to batch geocode multiple addresses with throttling and caching
  const batchGeocodeAddresses = async (addresses: string[]): Promise<Record<string, GeocodedWaypoint | { error: string }>> => {
    try {
      // Filter out empty addresses
      const validAddresses = addresses.filter(addr => addr && addr.trim().length > 0);

      if (validAddresses.length === 0) {
        return {};
      }

      // First, check which addresses are already in the cache
      const results: Record<string, GeocodedWaypoint | { error: string }> = {};
      const addressesToFetch: string[] = [];

      validAddresses.forEach(address => {
        const normalizedAddress = normalizeAddress(address);
        const cachedResult = geocodeCache[normalizedAddress];

        if (cachedResult) {
          const now = Date.now();
          const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

          if (now - cachedResult.timestamp < sevenDaysInMs) {
            // Use cached result
            console.log(`Using cached geocode for: ${normalizedAddress}`);
            results[address] = { lat: cachedResult.lat, lng: cachedResult.lng };
            return;
          }
        }

        // Not in cache or expired, need to fetch
        addressesToFetch.push(address);
      });

      // If all addresses were in cache, return early
      if (addressesToFetch.length === 0) {
        return results;
      }

      console.log(`Fetching ${addressesToFetch.length} addresses that weren't in cache`);

      // Process remaining addresses in batches to avoid overwhelming the server
      const batchSize = 2; // Process 2 addresses at a time

      for (let i = 0; i < addressesToFetch.length; i += batchSize) {
        const batch = addressesToFetch.slice(i, i + batchSize);

        // Process each batch in parallel
        const batchPromises = batch.map(async (address) => {
          const result = await geocodeAddress(address);
          return { address, result };
        });

        const batchResults = await Promise.allSettled(batchPromises);

        // Process results
        batchResults.forEach((promiseResult, index) => {
          const address = batch[index];

          if (promiseResult.status === 'fulfilled') {
            const { result } = promiseResult.value;
            results[address] = result;
          } else {
            results[address] = {
              error: promiseResult.reason?.message || 'Failed to process address'
            };
          }
        });

        // Add a small delay between batches to avoid overwhelming the server
        if (i + batchSize < addressesToFetch.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      return results;
    } catch (err) {
      console.error('Batch geocoding error:', err);
      // Return error for all addresses
      return addresses.reduce((acc, addr) => {
        acc[addr] = { error: 'Error during batch geocoding process' };
        return acc;
      }, {} as Record<string, { error: string }>);
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

    // Validate required fields
    if (!debouncedOrigin) {
      setError('Origin address is required.');
      setIsLoading(false);
      return;
    }

    if (!debouncedDestination) {
      setError('Destination address is required.');
      setIsLoading(false);
      return;
    }

    // Collect all addresses to geocode in a single batch
    const allAddresses: string[] = [debouncedOrigin, debouncedDestination];
    const validStops = debouncedStops.filter(stop => stop.value.trim().length > 0);
    const stopAddresses = validStops.map(stop => stop.value);
    allAddresses.push(...stopAddresses);

    // Batch geocode all addresses at once
    const geocodingResults = await batchGeocodeAddresses(allAddresses);

    // Process origin
    const originResult = geocodingResults[debouncedOrigin];
    if (!originResult || 'error' in originResult) {
      setError(`Origin geocoding failed: ${(originResult as any)?.error || 'Unknown error'}`);
      setIsLoading(false);
      return;
    }
    const originGeocoded = originResult as GeocodedWaypoint;

    // Process destination
    const destinationResult = geocodingResults[debouncedDestination];
    if (!destinationResult || 'error' in destinationResult) {
      setError(`Destination geocoding failed: ${(destinationResult as any)?.error || 'Unknown error'}`);
      setIsLoading(false);
      return;
    }
    const destinationGeocoded = destinationResult as GeocodedWaypoint;

    // Process via stops
    let validGeocodedViaStops: (Stop & GeocodedWaypoint)[] = [];
    if (validStops.length > 0) {
      const geocodedViaStopsResults = validStops.map(stop => {
        const result = geocodingResults[stop.value];
        if (!result || 'error' in result) {
          return {
            ...stop,
            error: (result as any)?.error || 'Failed to geocode address'
          };
        }
        return {
          ...stop,
          lat: (result as GeocodedWaypoint).lat,
          lng: (result as GeocodedWaypoint).lng,
          error: undefined
        };
      });

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
        { id: 'origin', value: debouncedOrigin },
        ...validGeocodedViaStops.map(s => ({ id: s.id, value: s.value })),
        { id: 'destination', value: debouncedDestination },
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
              Stops
            </label>
            {stops.map((stop, index) => (
              <div key={stop.id} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-8 text-right">{index + 1}.</span>
                <Input
                  type="text"
                  placeholder={`Enter stop ${index + 1} address`}
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