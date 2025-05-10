'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import flexpolyline from '@here/flexpolyline'; // Import the HERE flexible polyline library

// Fix for missing marker icons in Leaflet with Webpack/Next.js
// This needs to be done before any Leaflet markers are created.
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png', // Path relative to public directory
  iconUrl: '/images/marker-icon.png',       // Path relative to public directory
  shadowUrl: '/images/marker-shadow.png',     // Path relative to public directory
});


// Define the structure for the route sections needed by the map
interface OptimizedRouteSection {
  polyline: string; // Encoded polyline string from HERE
}

interface RouteMapPreviewProps {
  routeSections: OptimizedRouteSection[];
  // We might also need waypoint coordinates to add markers
  optimizedWaypointDetails: Array<{ id: string; lat: number; lng: number; }>;
}

// Custom hook to handle Leaflet map initialization
const useLeafletMap = (mapRef: React.RefObject<HTMLDivElement | null>, routeSections: OptimizedRouteSection[], waypoints: Array<{ lat: number; lng: number; id?: string }>) => {
  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    // Initialize map only once, using the mapElement directly
    const map = L.map(mapElement).setView([0, 0], 2); // Default view, will be adjusted later

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Decode and add route polylines
    if (routeSections && routeSections.length > 0) {
      const allLatLngs: L.LatLngExpression[] = [];
      routeSections.forEach(section => {
        // Decode the HERE API polyline
        try {
          console.log("Raw polyline string:", section.polyline); // Log the raw polyline
          // Decode using the @here/flexpolyline library
          const decodedCoordinates = flexpolyline.decode(section.polyline);
          // The result is an object like {polyline: [[lat, lng], ...]} or {polyline: [[lat, lng, elev], ...]}

          if (decodedCoordinates && decodedCoordinates.polyline && decodedCoordinates.polyline.length > 0) {
            // Convert to Leaflet's LatLngExpression format (array of [lat, lng])
            const leafletLatLngs: L.LatLngExpression[] = decodedCoordinates.polyline.map(coord => [coord[0], coord[1]]);
            L.polyline(leafletLatLngs, { color: '#007bff' }).addTo(map); // Use primary color
            allLatLngs.push(...leafletLatLngs);
          } else {
            console.error("Failed to decode or empty polyline from @here/flexpolyline:", section.polyline);
          }
        } catch (e) {
          console.error("Error decoding polyline with @here/flexpolyline:", section.polyline, e);
        }
      });

      // Fit map to polyline bounds
      if (allLatLngs.length > 0) {
        const bounds = L.latLngBounds(allLatLngs);
        map.fitBounds(bounds);
      }
    }

    // Add markers for waypoints
    if (waypoints && waypoints.length > 0) {
        waypoints.forEach((waypoint, index) => {
            // Basic marker for now
            L.marker([waypoint.lat, waypoint.lng]).addTo(map)
                .bindPopup(`Waypoint ${index + 1}`); // Basic popup
        });
    }


    // Cleanup function to remove map on component unmount
    return () => {
      map.remove();
    };
  }, [mapRef, routeSections, waypoints]); // Re-run effect if these props change

};


export default function RouteMapPreview({ routeSections, optimizedWaypointDetails }: RouteMapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  // Use the custom hook to manage the Leaflet map
  useLeafletMap(mapRef, routeSections, optimizedWaypointDetails);

  return (
    <div id="map" ref={mapRef} className="w-full h-full min-h-[300px] rounded-lg relative z-10" />
  );
}