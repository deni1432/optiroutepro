import { NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

const HERE_GEOCODE_URL = 'https://geocode.search.hereapi.com/v1/geocode';

// Create an LRU cache for geocoding results
// This cache will store up to 500 geocoded addresses for 7 days
const geocodeCache = new LRUCache<string, { lat: number; lng: number; address: string }>({
  max: 500, // Maximum number of items to store
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days in milliseconds
});

// Function to normalize addresses for consistent caching
function normalizeAddress(address: string): string {
  return address.toLowerCase().trim();
}

// Function to geocode a single address with caching
async function geocodeAddress(address: string, apiKey: string): Promise<{ lat: number; lng: number; address: string } | { error: string }> {
  // Normalize the address for caching
  const normalizedAddress = normalizeAddress(address);
  
  // Check if the address is already in the cache
  const cachedResult = geocodeCache.get(normalizedAddress);
  if (cachedResult) {
    console.log(`Cache hit for address: ${normalizedAddress}`);
    return cachedResult;
  }

  try {
    const params = new URLSearchParams({
      q: address,
      apiKey: apiKey,
    });

    const hereResponse = await fetch(`${HERE_GEOCODE_URL}?${params.toString()}`);
    const hereData = await hereResponse.json();

    if (!hereResponse.ok) {
      console.error('HERE API Error:', hereData);
      return { 
        error: hereData.error_description || hereData.error || 'Unknown HERE API error' 
      };
    }

    if (!hereData.items || hereData.items.length === 0) {
      return { error: 'No results found for the provided address.' };
    }

    // Assuming the first result is the most relevant
    const { position, title } = hereData.items[0];
    
    // Cache the result
    const result = {
      lat: position.lat,
      lng: position.lng,
      address: title, // The address as interpreted by HERE
    };
    
    geocodeCache.set(normalizedAddress, result);
    
    return result;
  } catch (error) {
    console.error('Geocoding API Error:', error);
    let errorMessage = 'An unexpected error occurred during geocoding.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { error: errorMessage };
  }
}

// Process addresses in batches with throttling
async function processBatchWithThrottling(addresses: string[], apiKey: string, batchSize = 5, delayMs = 200) {
  const results: Record<string, { lat?: number; lng?: number; address?: string; error?: string }> = {};
  
  // Process addresses in batches
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    
    // Process each batch in parallel
    const batchPromises = batch.map(async (address) => {
      const result = await geocodeAddress(address, apiKey);
      return { address, result };
    });
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Process results
    batchResults.forEach((promiseResult, index) => {
      const address = batch[index];
      
      if (promiseResult.status === 'fulfilled') {
        const { result } = promiseResult.value;
        
        if ('error' in result) {
          results[address] = { error: result.error };
        } else {
          results[address] = {
            lat: result.lat,
            lng: result.lng,
            address: result.address,
          };
        }
      } else {
        results[address] = { error: promiseResult.reason?.message || 'Failed to process address' };
      }
    });
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < addresses.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
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
    const { addresses } = body;

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json(
        { error: 'Invalid addresses provided. Expected a non-empty array of address strings.' },
        { status: 400 }
      );
    }

    // Filter out empty addresses
    const validAddresses = addresses.filter(addr => typeof addr === 'string' && addr.trim().length > 0);
    
    if (validAddresses.length === 0) {
      return NextResponse.json(
        { error: 'No valid addresses provided after filtering.' },
        { status: 400 }
      );
    }

    // Process the batch of addresses
    const results = await processBatchWithThrottling(validAddresses, hereApiKey);
    
    return NextResponse.json({ results });

  } catch (error) {
    console.error('Batch Geocoding API Error:', error);
    let errorMessage = 'An unexpected error occurred during batch geocoding.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
