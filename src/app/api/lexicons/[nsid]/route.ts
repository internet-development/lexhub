import type { NextRequest } from "next/server";
import { db } from "@/db";
import { validLexicons, invalidLexicons } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { isValidNsid } from "@atproto/syntax";
import {
  ValidationError,
  parseBooleanParam,
  parseIntegerParam,
} from "@/util/params";

interface QueryParams {
  valid: boolean;
  latest: boolean;
  limit: number;
  offset: number;
}

function parseQueryParams(searchParams: URLSearchParams): QueryParams {
  const valid = parseBooleanParam(searchParams, "valid", true);
  const latest = parseBooleanParam(searchParams, "latest", false);
  const limit = parseIntegerParam(searchParams, "limit", 50, {
    min: 1,
    max: 100,
  });
  const offset = parseIntegerParam(searchParams, "offset", 0, { min: 0 });

  return { valid, latest, limit, offset };
}

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
    if (!isValidNsid(nsid)) {
      throw new ValidationError(
        "INVALID_NSID",
        "The provided NSID is not valid",
      );
    }

    const { valid, latest, limit, offset } = parseQueryParams(
      request.nextUrl.searchParams,
    );

    const table = valid ? validLexicons : invalidLexicons;

    if (latest) {
      return Response.json({ data: await queryLatest(table, nsid) });
    }

    const { records, count } = await queryTable(table, nsid, limit, offset);

    return Response.json({
      data: records,
      pagination: { limit, offset, total: count },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return error.toResponse();
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
