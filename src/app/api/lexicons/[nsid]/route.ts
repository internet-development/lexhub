import type { NextRequest } from "next/server";
import { db } from "@/db";
import { validLexicons, invalidLexicons } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { isValidNsid } from "@atproto/syntax";

// Custom error class for validation errors
class ValidationError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

// Helper to parse and validate boolean query parameters
function parseBooleanParam(
  searchParams: URLSearchParams,
  paramName: string,
  defaultValue: boolean,
): boolean {
  const value = searchParams.get(paramName);

  if (value === null) {
    return defaultValue;
  }

  if (value !== "true" && value !== "false") {
    throw new ValidationError(
      `INVALID_${paramName.toUpperCase()}_PARAM`,
      `${paramName} parameter must be either 'true' or 'false'`,
    );
  }

  return value === "true";
}

// Query parameters interface
interface QueryParams {
  valid: boolean;
  latest: boolean;
  limit: number;
  offset: number;
}

// Parse and validate all query parameters
function parseQueryParams(searchParams: URLSearchParams): QueryParams {
  // Parse boolean parameters
  const valid = parseBooleanParam(searchParams, "valid", true);
  const latest = parseBooleanParam(searchParams, "latest", false);

  // Parse pagination parameters
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Validate pagination parameters
  if (isNaN(limit) || limit < 1) {
    throw new ValidationError(
      "INVALID_LIMIT",
      "Limit must be a positive number",
    );
  }
  if (isNaN(offset) || offset < 0) {
    throw new ValidationError(
      "INVALID_OFFSET",
      "Offset must be a non-negative number",
    );
  }

  return { valid, latest, limit, offset };
}

// Generic query builder for fetching lexicons from a table
async function queryTable(
  table: typeof validLexicons | typeof invalidLexicons,
  nsid: string,
  limit: number,
  offset: number,
) {
  const [records, countResult] = await Promise.all([
    db
      .select()
      .from(table)
      .where(eq(table.nsid, nsid))
      .orderBy(desc(table.ingestedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(table)
      .where(eq(table.nsid, nsid)),
  ]);

  return { records, count: Number(countResult[0].count) };
}

// Fetch latest record from a table
async function queryLatest(
  table: typeof validLexicons | typeof invalidLexicons,
  nsid: string,
) {
  const records = await db
    .select()
    .from(table)
    .where(eq(table.nsid, nsid))
    .orderBy(desc(table.ingestedAt))
    .limit(1);

  return records[0] || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nsid: string }> },
) {
  try {
    const { nsid } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Validate NSID
    if (!isValidNsid(nsid)) {
      throw new ValidationError(
        "INVALID_NSID",
        "The provided NSID is not valid",
      );
    }

    // Parse and validate all query parameters
    const { valid, latest, limit, offset } = parseQueryParams(searchParams);

    // Determine which table to query
    const table = valid ? validLexicons : invalidLexicons;

    // Handle "latest" query - simpler logic, early return
    if (latest) {
      return Response.json({ data: await queryLatest(table, nsid) });
    }

    // Handle paginated queries
    const { records, count } = await queryTable(table, nsid, limit, offset);

    return Response.json({
      data: records,
      pagination: { limit, offset, total: count },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ValidationError) {
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status: 400 },
      );
    }

    console.error("Error fetching lexicons for NSID:", error);
    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch lexicons",
        },
      },
      { status: 500 },
    );
  }
}
