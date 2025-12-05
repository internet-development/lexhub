import type { NextRequest } from "next/server";
import { db } from "@/db";
import { validLexicons, invalidLexicons } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { isValidNsid } from "@atproto/syntax";

// Helper to parse and validate pagination params
function parsePaginationParams(searchParams: URLSearchParams) {
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  if (isNaN(limit) || limit < 1) {
    throw { code: "INVALID_LIMIT", message: "Limit must be a positive number" };
  }
  if (isNaN(offset) || offset < 0) {
    throw {
      code: "INVALID_OFFSET",
      message: "Offset must be a non-negative number",
    };
  }

  return { limit, offset };
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
      return Response.json(
        {
          error: {
            code: "INVALID_NSID",
            message: "The provided NSID is not valid",
          },
        },
        { status: 400 },
      );
    }

    // Parse query parameters - default to valid=true
    const validParam = searchParams.get("valid") ?? "true";
    const latest = searchParams.get("latest") === "true";

    // Determine which table to query
    const table = validParam === "false" ? invalidLexicons : validLexicons;

    // Handle "latest" query - simpler logic, early return
    if (latest) {
      return Response.json({ data: await queryLatest(table, nsid) });
    }

    // Handle paginated queries
    const { limit, offset } = parsePaginationParams(searchParams);
    const { records, count } = await queryTable(table, nsid, limit, offset);

    return Response.json({
      data: records,
      pagination: { limit, offset, total: count },
    });
  } catch (error) {
    // Handle custom validation errors
    if (error && typeof error === "object" && "code" in error) {
      return Response.json({ error }, { status: 400 });
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
