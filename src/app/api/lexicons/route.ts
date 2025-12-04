import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { validLexicons, invalidLexicons } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const validParam = searchParams.get("valid");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10),
      100,
    );
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Validate parameters
    if (isNaN(limit) || limit < 1) {
      return;
      NextResponse.json(
        {
          error: {
            code: "INVALID_LIMIT",
            message: "Limit must be a positive number",
          },
        },
        { status: 400 },
      );
    }

    if (isNaN(offset) || offset < 0) {
      return;
      NextResponse.json(
        {
          error: {
            code: "INVALID_OFFSET",
            message: "Offset must be a non-negative number",
          },
        },
        { status: 400 },
      );
    }

    // Determine which table(s) to query
    let data;
    let total;

    if (validParam === "true") {
      // Query only valid lexicons
      const [lexicons, countResult] = await Promise.all([
        db
          .select()
          .from(validLexicons)
          .orderBy(desc(validLexicons.ingestedAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(validLexicons),
      ]);

      data = lexicons;
      total = Number(countResult[0].count);
    } else if (validParam === "false") {
      // Query only invalid lexicons
      const [lexicons, countResult] = await Promise.all([
        db
          .select()
          .from(invalidLexicons)
          .orderBy(desc(invalidLexicons.ingestedAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(invalidLexicons),
      ]);

      data = lexicons;
      total = Number(countResult[0].count);
    } else {
      // Query both tables and merge results
      const [validLexs, invalidLexs, validCount, invalidCount] =
        await Promise.all([
          db
            .select()
            .from(validLexicons)
            .orderBy(desc(validLexicons.ingestedAt))
            .limit(limit)
            .offset(offset),
          db
            .select()
            .from(invalidLexicons)
            .orderBy(desc(invalidLexicons.ingestedAt))
            .limit(limit)
            .offset(offset),
          db.select({ count: sql<number>`count(*)` }).from(validLexicons),
          db.select({ count: sql<number>`count(*)` }).from(invalidLexicons),
        ]);

      // Merge and sort by ingestedAt
      const merged = [
        ...validLexs.map((l) => ({ ...l, valid: true })),
        ...invalidLexs.map((l) => ({ ...l, valid: false })),
      ].sort(
        (a, b) =>
          new Date(b.ingestedAt).getTime() - new Date(a.ingestedAt).getTime(),
      );

      data = merged.slice(0, limit);
      total = Number(validCount[0].count) + Number(invalidCount[0].count);
    }

    return NextResponse.json({
      data,
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching lexicons:", error);
    return NextResponse.json(
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
