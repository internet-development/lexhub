import type { NextRequest } from "next/server";
import { db } from "@/db";
import { validLexicons, invalidLexicons } from "@/db/schema";
import { desc } from "drizzle-orm";
import {
  ValidationError,
  parseBooleanParam,
  parseIntegerParam,
} from "@/util/params";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const valid = parseBooleanParam(searchParams, "valid", true);
    const limit = parseIntegerParam(searchParams, "limit", 50, {
      min: 1,
      max: 100,
    });
    const offset = parseIntegerParam(searchParams, "offset", 0, { min: 0 });

    const table = valid ? validLexicons : invalidLexicons;

    const [lexicons, total] = await Promise.all([
      db
        .select()
        .from(table)
        .orderBy(desc(table.ingestedAt))
        .limit(limit)
        .offset(offset),
      db.$count(table),
    ]);

    return Response.json({
      data: lexicons,
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return error.toResponse();
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
