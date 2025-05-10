import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json();

    if (lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'Latitude and longitude are required.' }, { status: 400 });
    }

    const apiKey = process.env.HERE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'HERE API key not configured.' }, { status: 500 });
    }

    // HERE Geocoding and Search API endpoint for reverse geocoding
    const hereApiUrl = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lng}&apiKey=${apiKey}`;

    const hereResponse = await fetch(hereApiUrl);
    const hereData = await hereResponse.json();

    if (!hereResponse.ok) {
      console.error('[Reverse Geocode API] HERE API error:', hereData);
      return NextResponse.json({ error: hereData.error || 'Failed to reverse geocode location.' }, { status: hereResponse.status });
    }

    // Extract the formatted address from the HERE API response
    // The structure might vary slightly based on the response,
    // but typically it's in items[0].address.label
    const address = hereData.items?.[0]?.address?.label;

    if (!address) {
      console.warn('[Reverse Geocode API] No address found for coordinates:', { lat, lng });
      return NextResponse.json({ error: 'No address found for this location.' }, { status: 404 });
    }

    return NextResponse.json({ address });

  } catch (error: any) {
    console.error('[Reverse Geocode API] Error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during reverse geocoding.' }, { status: 500 });
  }
}