import { NextResponse } from 'next/server';

// HERE API URLs
const HERE_ROUTE_URL = 'https://router.hereapi.com/v8/routes';
const HERE_SEQUENCE_URL = 'https://wse.ls.hereapi.com/2/findsequence.json'; // Waypoint Sequence Extension

interface Waypoint {
  lat: number;
  lng: number;
  id?: string; // Optional ID to map back to original stops
}

export async function POST(request: Request) {
  const hereApiKey = process.env.HERE_API_KEY;

  if (!hereApiKey) {
    console.error('HERE_API_KEY is not configured.');
    return NextResponse.json(
      { error: 'Server configuration error: Missing API key.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { origin, destination, viaStops } = body as {
      origin: Waypoint;
      destination: Waypoint;
      viaStops?: Waypoint[];
    };

    if (!origin || typeof origin.lat !== 'number' || typeof origin.lng !== 'number') {
      return NextResponse.json(
        { error: 'Invalid origin provided. It must be an object with lat and lng numbers.' },
        { status: 400 }
      );
    }

    if (!destination || typeof destination.lat !== 'number' || typeof destination.lng !== 'number') {
      return NextResponse.json(
        { error: 'Invalid destination provided. It must be an object with lat and lng numbers.' },
        { status: 400 }
      );
    }

    if (viaStops) {
      if (!Array.isArray(viaStops)) {
        return NextResponse.json(
          { error: 'Invalid viaStops provided. It must be an array of waypoints.' },
          { status: 400 }
        );
      }
      for (const via of viaStops) {
        if (typeof via.lat !== 'number' || typeof via.lng !== 'number') {
          return NextResponse.json(
            { error: 'Invalid via waypoint. Each must have lat and lng numbers.' },
            { status: 400 }
          );
        }
      }
    }
    
        // --- Step 1: Find the optimal sequence of waypoints ---
        // The Waypoint Sequence Extension expects 'start', 'destinationN', and 'end' parameters.
        // 'destinationN' are the intermediate stops to be optimized.
        // We need to assign temporary IDs to map them back.
    
        const sequenceParams = new URLSearchParams({
          start: `${origin.id};${origin.lat},${origin.lng}`, // id;lat,lng
          end: `${destination.id};${destination.lat},${destination.lng}`, // id;lat,lng
          mode: 'fastest;car', // Mode for sequencing
          apiKey: hereApiKey,
        });
    
        (viaStops || []).forEach((stop, index) => {
          // Ensure via stops also have an ID for mapping back
          const stopId = stop.id || `via-${index}`;
          sequenceParams.append(`destination${index + 1}`, `${stopId};${stop.lat},${stop.lng}`);
        });
        
        console.log('Calling HERE FindSequence with params:', sequenceParams.toString());
        const sequenceResponse = await fetch(`${HERE_SEQUENCE_URL}?${sequenceParams.toString()}`);
        const sequenceData = await sequenceResponse.json();
    
        if (!sequenceResponse.ok || !sequenceData.results || sequenceData.results.length === 0 || !sequenceData.results[0].waypoints) {
          console.error('HERE FindSequence API Error:', sequenceData);
          return NextResponse.json(
            {
              error: 'Failed to determine optimal waypoint sequence.',
              details: sequenceData.faultCode || sequenceData.type || sequenceData.title || 'Unknown FindSequence API error'
            },
            { status: sequenceResponse.status || 500 }
          );
        }
    
        const optimizedWaypoints = sequenceData.results[0].waypoints as Array<{
          id: string;
          lat: number;
          lng: number;
          sequence: number; // The optimized order
          estimatedArrival: string | null;
          estimatedDeparture: string | null;
          // ... other properties
        }>;
    
        // Sort waypoints by the optimized sequence
        optimizedWaypoints.sort((a, b) => a.sequence - b.sequence);
        
        // The sorted optimizedWaypoints now contains origin, all via stops in optimal order, and destination.
        // The first one is origin, last one is destination.
        const finalOrigin = optimizedWaypoints[0];
        const finalDestination = optimizedWaypoints[optimizedWaypoints.length - 1];
        const finalViaStops = optimizedWaypoints.slice(1, -1);
    
    
        // --- Step 2: Get the detailed route for the optimized sequence ---
        const routeParams = new URLSearchParams({
          origin: `${finalOrigin.lat},${finalOrigin.lng}`,
          destination: `${finalDestination.lat},${finalDestination.lng}`,
          transportMode: 'car',
          routingMode: 'fast',
          return: 'polyline,summary,actions,instructions',
          departureTime: 'any',
          apiKey: hereApiKey,
        });
    
        if (finalViaStops.length > 0) {
          finalViaStops.forEach(wp => {
            routeParams.append('via', `${wp.lat},${wp.lng}`);
          });
        }
        
        console.log('Calling HERE Routes with params:', routeParams.toString());
        const routeResponse = await fetch(`${HERE_ROUTE_URL}?${routeParams.toString()}`);
        const routeData = await routeResponse.json();
        console.log('Full HERE Routes API Response:', JSON.stringify(routeData, null, 2)); // Log the full response

        if (!routeResponse.ok || !routeData.routes || routeData.routes.length === 0) {
          console.error('HERE Routing API Error (after sequence):', routeData);
          return NextResponse.json(
            {
              error: 'Failed to calculate route for the optimized sequence.',
              details: routeData.title || routeData.cause || 'Unknown HERE API error'
            },
            { status: routeResponse.status || 500 }
          );
        }
        
        const route = routeData.routes[0];
        // route.summary is not present at the top level for multi-section routes.
        // The total summary is calculated below by summing section summaries.
        // Map original IDs back to the sections if possible.
        // The sections are between the waypoints in finalOptimizedWaypoints.
        // We need to associate the original input (e.g., address string, original ID from form)
        // with each point in optimizedWaypoints.
        // The `id` field we passed to findsequence should be in `optimizedWaypoints[i].id`.
        
        const sections = route.sections.map((section: any, sectionIndex: number) => {
          // The departure of section `i` corresponds to `optimizedWaypoints[i]`.
          // The arrival of section `i` corresponds to `optimizedWaypoints[i+1]`.
          const departureWaypoint = optimizedWaypoints[sectionIndex];
          const arrivalWaypoint = optimizedWaypoints[sectionIndex + 1];
    
          return {
            departure: {
              place: section.departure.place, // This is HERE's place object
              time: section.departure.time,
              originalId: departureWaypoint?.id, // Map back our ID
            },
            arrival: {
              place: section.arrival.place,
              time: section.arrival.time,
              originalId: arrivalWaypoint?.id,
            },
            summary: section.summary,
            polyline: section.polyline,
            actions: section.actions?.map((action: any) => ({
              instruction: action.instruction,
              duration: action.duration,
              length: action.length,
            })),
          };
        });
    
    
        // Calculate total duration and length by summing section summaries
        const totalDuration = route.sections.reduce((sum: number, section: any) => sum + (section.summary?.duration || 0), 0);
        const totalLength = route.sections.reduce((sum: number, section: any) => sum + (section.summary?.length || 0), 0);

        return NextResponse.json({
          // We need to return the optimized waypoints in order, plus the route sections
          // The frontend will use optimizedWaypoints to display the list of stops with original addresses
          // and sections for drawing the route and leg details.
          optimizedWaypointDetails: optimizedWaypoints.map(wp => ({
            id: wp.id, // This is the ID we sent (origin, destination, or via-N / stop.id)
            lat: wp.lat,
            lng: wp.lng,
            // sequence: wp.sequence, // Not strictly needed by frontend if already sorted
          })),
          routeSections: sections, // These are the legs between the optimized waypoints
          totalDuration: totalDuration, // Use calculated total duration
          totalLength: totalLength,   // Use calculated total length
        });
    
      } catch (error) {
    console.error('Route Optimization API Error:', error);
    let errorMessage = 'An unexpected error occurred during route optimization.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}