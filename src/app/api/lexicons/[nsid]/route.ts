import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { validLexicons, invalidLexicons } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

/**
 * Validates Namespaced Identifiers (NSIDs) according to AT Protocol spec
 * https://atproto.com/specs/nsid
 */
const SPEC_NSID_REGEX =
  /^[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(\.[a-zA-Z]([a-zA-Z0-9]{0,62})?)$/;

function isValidNSID(nsid: string): boolean {
  return SPEC_NSID_REGEX.test(nsid);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nsid: string }> },
) {
  try {
    const { nsid } = await params;
    const { searchParams } = new URL(request.url);

    // Validate NSID
    if (!isValidNSID(nsid)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_NSID",
            message: "The provided NSID is not valid",
          },
        },
        { status: 400 },
      );
    }

    // Parse query parameters
    const validParam = searchParams.get("valid");
    const latest = searchParams.get("latest") === "true";
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10),
      100,
    );
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Validate parameters
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
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
      return NextResponse.json(
        {
          error: {
            code: "INVALID_OFFSET",
            message: "Offset must be a non-negative number",
          },
        },
        { status: 400 },
      );
    }

    let data;
    let total;

    if (validParam === "true") {
      // Query only valid lexicons for this NSID
      if (latest) {
        const lexicon = await db
          .select()
          .from(validLexicons)
          .where(eq(validLexicons.nsid, nsid))
          .orderBy(desc(validLexicons.ingestedAt))
          .limit(1);

        return NextResponse.json({
          data: lexicon[0] || null,
        });
      } else {
        const [lexicons, countResult] = await Promise.all([
          db
            .select()
            .from(validLexicons)
            .where(eq(validLexicons.nsid, nsid))
            .orderBy(desc(validLexicons.ingestedAt))
            .limit(limit)
            .offset(offset),
          db
            .select({ count: sql<number>`count(*)` })
            .from(validLexicons)
            .where(eq(validLexicons.nsid, nsid)),
        ]);

        data = lexicons;
        total = Number(countResult[0].count);
      }
    } else if (validParam === "false") {
      // Query only invalid lexicons for this NSID
      if (latest) {
        const lexicon = await db
          .select()
          .from(invalidLexicons)
          .where(eq(invalidLexicons.nsid, nsid))
          .orderBy(desc(invalidLexicons.ingestedAt))
          .limit(1);

        return NextResponse.json({
          data: lexicon[0] || null,
        });
      } else {
        const [lexicons, countResult] = await Promise.all([
          db
            .select()
            .from(invalidLexicons)
            .where(eq(invalidLexicons.nsid, nsid))
            .orderBy(desc(invalidLexicons.ingestedAt))
            .limit(limit)
            .offset(offset),
          db
            .select({ count: sql<number>`count(*)` })
            .from(invalidLexicons)
            .where(eq(invalidLexicons.nsid, nsid)),
        ]);

        data = lexicons;
        total = Number(countResult[0].count);
      }
    } else {
      // Query both tables for this NSID
      if (latest) {
        const [validLex, invalidLex] = await Promise.all([
          db
            .select()
            .from(validLexicons)
            .where(eq(validLexicons.nsid, nsid))
            .orderBy(desc(validLexicons.ingestedAt))
            .limit(1),
          db
            .select()
            .from(invalidLexicons)
            .where(eq(invalidLexicons.nsid, nsid))
            .orderBy(desc(invalidLexicons.ingestedAt))
            .limit(1),
        ]);

        // Return the most recent one
        const validDate = validLex[0]
          ? new Date(validLex[0].ingestedAt).getTime()
          : 0;
        const invalidDate = invalidLex[0]
          ? new Date(invalidLex[0].ingestedAt).getTime()
          : 0;

        const latest = validDate > invalidDate ? validLex[0] : invalidLex[0];

        return NextResponse.json({
          data: latest || null,
        });
      } else {
        const [validLexs, invalidLexs, validCount, invalidCount] =
          await Promise.all([
            db
              .select()
              .from(validLexicons)
              .where(eq(validLexicons.nsid, nsid))
              .orderBy(desc(validLexicons.ingestedAt))
              .limit(limit)
              .offset(offset),
            db
              .select()
              .from(invalidLexicons)
              .where(eq(invalidLexicons.nsid, nsid))
              .orderBy(desc(invalidLexicons.ingestedAt))
              .limit(limit)
              .offset(offset),
            db
              .select({ count: sql<number>`count(*)` })
              .from(validLexicons)
              .where(eq(validLexicons.nsid, nsid)),
            db
              .select({ count: sql<number>`count(*)` })
              .from(invalidLexicons)
              .where(eq(invalidLexicons.nsid, nsid)),
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
    console.error("Error fetching lexicons for NSID:", error);
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
