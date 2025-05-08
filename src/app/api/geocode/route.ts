import { NextResponse } from 'next/server';

const HERE_GEOCODE_URL = 'https://geocode.search.hereapi.com/v1/geocode';

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
    const address = body.address;

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Invalid address provided. It must be a non-empty string.' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      q: address,
      apiKey: hereApiKey,
    });

    const hereResponse = await fetch(`${HERE_GEOCODE_URL}?${params.toString()}`);
    const hereData = await hereResponse.json();

    if (!hereResponse.ok) {
      console.error('HERE API Error:', hereData);
      return NextResponse.json(
        { 
          error: 'Failed to geocode address.', 
          details: hereData.error_description || hereData.error || 'Unknown HERE API error' 
        },
        { status: hereResponse.status }
      );
    }

    if (!hereData.items || hereData.items.length === 0) {
      return NextResponse.json(
        { error: 'No results found for the provided address.' },
        { status: 404 }
      );
    }

    // Assuming the first result is the most relevant
    const { position, title } = hereData.items[0];
    
    return NextResponse.json({
      address: title, // The address as interpreted by HERE
      lat: position.lat,
      lng: position.lng,
    });

  } catch (error) {
    console.error('Geocoding API Error:', error);
    let errorMessage = 'An unexpected error occurred during geocoding.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}