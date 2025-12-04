import { NextResponse } from "next/server";

/**
 * CORS headers configuration for read-only API endpoints.
 * Currently allows all origins for development/testing purposes.
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreFlight() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Add CORS headers to a response
 */
export function withCors(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
