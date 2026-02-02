import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get fileId from query params
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');

  if (!fileId) {
    return NextResponse.json({ error: 'Missing fileId parameter' }, { status: 400 });
  }

  try {
    // Fetch from Google Drive public export
    // This works for "Anyone with the link" files without an API key if done server-side
    const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    const response = await fetch(driveUrl);

    if (!response.ok) {
        // If it fails here, the file is likely private or deleted
        return NextResponse.json(
            { error: `Google Drive returned ${response.status}`, details: response.statusText }, 
            { status: response.status }
        );
    }

    // Check Content-Type to ensure we got JSON (and not a login page or virus scan warning)
    const contentType = response.headers.get('content-type');
    
    // Google Drive usually returns 'application/json' for JSON files, 
    // but sometimes 'application/octet-stream' or 'text/plain'.
    // If it returns 'text/html', it's likely an error/login page.
    if (contentType && contentType.includes('text/html')) {
        return NextResponse.json(
            { error: 'File is not accessible publicly. Authentication required.' },
            { status: 403 }
        );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
        { error: 'Internal Server Error', details: error.message }, 
        { status: 500 }
    );
  }
}
