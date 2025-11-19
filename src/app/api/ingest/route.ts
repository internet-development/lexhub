import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO(@elijaharita)
    console.log('Received data:', body);

    return NextResponse.json(
      {
        success: true,
        message: 'Data ingested successfully',
        data: body
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing ingest request:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request'
      },
      { status: 400 }
    );
  }
}
