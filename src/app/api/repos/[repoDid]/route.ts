import type { NextRequest } from "next/server";
import { db } from "@/db";
import { validLexicons, invalidLexicons } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureValidDid } from "@atproto/syntax";
import {
  ValidationError,
  parseBooleanParam,
  parseIntegerParam,
} from "@/util/params";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repoDid: string }> },
) {
  try {
    const { repoDid } = await params;
    const searchParams = request.nextUrl.searchParams;

    try {
      ensureValidDid(repoDid);
    } catch (error) {
      throw new ValidationError("INVALID_DID", "The provided DID is not valid");
    }

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
        .where(eq(table.repoDid, repoDid))
        .orderBy(desc(table.ingestedAt))
        .limit(limit)
        .offset(offset),
      db.$count(table, eq(table.repoDid, repoDid)),
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

    console.error("Error fetching lexicons for repository:", error);
    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch lexicons for repository",
        },
      },
      { status: 500 },
    );
  }
}
