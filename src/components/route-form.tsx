'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, XCircle, MapPin, Navigation } from 'lucide-react';

interface Stop {
  id: string;
  value: string;
}

export default function RouteForm() {
  const [origin, setOrigin] = useState('');
  const [stops, setStops] = useState<Stop[]>([{ id: crypto.randomUUID(), value: '' }]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddStop = () => {
    if (stops.length < 50) { // Max 50 stops as per requirements
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
    // TODO: Implement API call to backend for geocoding and optimization
    console.log('Form submitted:', { origin, stops });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    // TODO: Handle API response and update UI (e.g., show map, list of stops)
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="mr-2 h-6 w-6 text-primary" />
          Plan Your Route
        </CardTitle>
        <CardDescription>Enter your starting point and up to 50 stops to optimize your journey.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div>
            <label htmlFor="origin" className="block text-sm font-medium text-foreground mb-1">
              Origin
            </label>
            <Input
              id="origin"
              type="text"
              placeholder="Enter starting address"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              required
              className="w-full"
            />
          </div>

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
                  required
                  className="flex-grow"
                />
                {stops.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStop(stop.id)}
                    aria-label="Remove stop"
                  >
                    <XCircle className="h-5 w-5 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            {stops.length < 50 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddStop}
                className="w-full group"
              >
                <PlusCircle className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Add Stop
              </Button>
            )}
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