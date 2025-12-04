import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { validLexicons, invalidLexicons } from "@/db/schema";
import { handleCorsPreFlight, withCors } from "@/util/cors";
import { desc, eq, sql } from "drizzle-orm";

/**
 * Basic DID validation - checks if string starts with 'did:' and has method
 */
function isValidDID(did: string): boolean {
  return /^did:[a-z]+:.+/.test(did);
}

export async function OPTIONS() {
  return handleCorsPreFlight();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repoDid: string }> }
) {
  try {
    const { repoDid } = await params;
    const { searchParams } = new URL(request.url);

    // Validate DID
    if (!isValidDID(repoDid)) {
      return withCors(
        NextResponse.json(
          {
            error: {
              code: "INVALID_DID",
              message: "The provided DID is not valid",
            },
          },
          { status: 400 }
        )
      );
    }

    // Parse query parameters
    const validParam = searchParams.get("valid");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10),
      100
    );
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Validate parameters
    if (isNaN(limit) || limit < 1) {
      return withCors(
        NextResponse.json(
          {
            error: {
              code: "INVALID_LIMIT",
              message: "Limit must be a positive number",
            },
          },
          { status: 400 }
        )
      );
    }

    if (isNaN(offset) || offset < 0) {
      return withCors(
        NextResponse.json(
          {
            error: {
              code: "INVALID_OFFSET",
              message: "Offset must be a non-negative number",
            },
          },
          { status: 400 }
        )
      );
    }

    let data;
    let total;

    if (validParam === "true") {
      // Query only valid lexicons for this repository
      const [lexicons, countResult] = await Promise.all([
        db
          .select()
          .from(validLexicons)
          .where(eq(validLexicons.repoDid, repoDid))
          .orderBy(desc(validLexicons.ingestedAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(validLexicons)
          .where(eq(validLexicons.repoDid, repoDid)),
      ]);

      data = lexicons;
      total = Number(countResult[0].count);
    } else if (validParam === "false") {
      // Query only invalid lexicons for this repository
      const [lexicons, countResult] = await Promise.all([
        db
          .select()
          .from(invalidLexicons)
          .where(eq(invalidLexicons.repoDid, repoDid))
          .orderBy(desc(invalidLexicons.ingestedAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(invalidLexicons)
          .where(eq(invalidLexicons.repoDid, repoDid)),
      ]);

      data = lexicons;
      total = Number(countResult[0].count);
    } else {
      // Query both tables for this repository
      const [validLexs, invalidLexs, validCount, invalidCount] =
        await Promise.all([
          db
            .select()
            .from(validLexicons)
            .where(eq(validLexicons.repoDid, repoDid))
            .orderBy(desc(validLexicons.ingestedAt))
            .limit(limit)
            .offset(offset),
          db
            .select()
            .from(invalidLexicons)
            .where(eq(invalidLexicons.repoDid, repoDid))
            .orderBy(desc(invalidLexicons.ingestedAt))
            .limit(limit)
            .offset(offset),
          db
            .select({ count: sql<number>`count(*)` })
            .from(validLexicons)
            .where(eq(validLexicons.repoDid, repoDid)),
          db
            .select({ count: sql<number>`count(*)` })
            .from(invalidLexicons)
            .where(eq(invalidLexicons.repoDid, repoDid)),
        ]);

      // Merge and sort by ingestedAt
      const merged = [
        ...validLexs.map((l) => ({ ...l, valid: true })),
        ...invalidLexs.map((l) => ({ ...l, valid: false })),
      ].sort(
        (a, b) =>
          new Date(b.ingestedAt).getTime() - new Date(a.ingestedAt).getTime()
      );

      data = merged.slice(0, limit);
      total = Number(validCount[0].count) + Number(invalidCount[0].count);
    }

    return withCors(
      NextResponse.json({
        data,
        pagination: {
          limit,
          offset,
          total,
        },
      })
    );
  } catch (error) {
    console.error("Error fetching lexicons for repository:", error);
    return withCors(
      NextResponse.json(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to fetch lexicons for repository",
          },
        },
        { status: 500 }
      )
    );
  }
}
