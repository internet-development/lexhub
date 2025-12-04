import { NextRequest, NextResponse } from "next/server";

/**
 * CORS configuration for API routes.
 * Currently allows all origins for development/testing purposes.
 * TODO: Lock down origins in production.
 */
const corsOptions = {
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function proxy(request: NextRequest) {
  // Handle preflight requests
  const isPreflight = request.method === "OPTIONS";

  if (isPreflight) {
    const preflightHeaders = {
      "Access-Control-Allow-Origin": "*",
      ...corsOptions,
    };
    return NextResponse.json({}, { headers: preflightHeaders });
  }

  // Handle simple requests
  const response = NextResponse.next();

  response.headers.set("Access-Control-Allow-Origin", "*");

  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
