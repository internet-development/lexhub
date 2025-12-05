import type { NextRequest } from "next/server";
import { db } from "@/db";
import { validLexicons, invalidLexicons } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import {
  ValidationError,
  parseBooleanParam,
  parseIntegerParam,
} from "@/util/params";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters with defaults
    const valid = parseBooleanParam(searchParams, "valid", true);
    const limit = parseIntegerParam(searchParams, "limit", 50, {
      min: 1,
      max: 100,
    });
    const offset = parseIntegerParam(searchParams, "offset", 0, { min: 0 });

    // Determine which table to query
    const table = valid ? validLexicons : invalidLexicons;

    // Query the selected table
    const [lexicons, countResult] = await Promise.all([
      db
        .select()
        .from(table)
        .orderBy(desc(table.ingestedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(table),
    ]);

    return Response.json({
      data: lexicons,
      pagination: {
        limit,
        offset,
        total: Number(countResult[0].count),
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ValidationError) {
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status: 400 },
      );
    }

    console.error("Error fetching lexicons:", error);
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
