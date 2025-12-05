import type { NextRequest } from "next/server";
import { db } from "@/db";
import { validLexicons, invalidLexicons } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { AtUri, isValidHandle } from "@atproto/syntax";
import { IdResolver } from "@atproto/identity";
import { ValidationError } from "@/util/params";

const idResolver = new IdResolver();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const uriParam = searchParams.get("uri");
    const cidParam = searchParams.get("cid");

    if (!uriParam) {
      throw new ValidationError("MISSING_URI", "URI parameter is required");
    }

    // Parse AT URI
    let atUri: AtUri;
    try {
      atUri = new AtUri(uriParam);
    } catch (error) {
      throw new ValidationError("INVALID_AT_URI", "Invalid AT URI format");
    }

    // Validate that we have collection and rkey (NSID)
    if (!atUri.collection || !atUri.rkey) {
      throw new ValidationError(
        "INVALID_AT_URI_PATH",
        "AT URI must include collection and record key",
      );
    }

    // Resolve handle to DID if necessary
    let repoDid = atUri.hostname;
    if (isValidHandle(repoDid)) {
      try {
        const resolvedDid = await idResolver.handle.resolve(repoDid);
        if (!resolvedDid) {
          return Response.json(
            {
              error: {
                code: "HANDLE_NOT_FOUND",
                message: `Could not resolve handle: ${repoDid}`,
              },
            },
            { status: 404 },
          );
        }
        repoDid = resolvedDid;
      } catch (error) {
        console.error("Error resolving handle:", error);
        return Response.json(
          {
            error: {
              code: "HANDLE_RESOLUTION_ERROR",
              message: "Failed to resolve handle to DID",
            },
          },
          { status: 500 },
        );
      }
    }

    // Extract NSID from AT URI rkey
    const nsid = atUri.rkey;

    // If CID is provided, return exact version
    if (cidParam) {
      // Try valid lexicons first
      const validLexicon = await db
        .select()
        .from(validLexicons)
        .where(
          and(
            eq(validLexicons.nsid, nsid),
            eq(validLexicons.cid, cidParam),
            eq(validLexicons.repoDid, repoDid),
          ),
        )
        .limit(1);

      if (validLexicon.length > 0) {
        return Response.json({
          data: validLexicon[0],
        });
      }

      // Try invalid lexicons
      const invalidLexicon = await db
        .select()
        .from(invalidLexicons)
        .where(
          and(
            eq(invalidLexicons.nsid, nsid),
            eq(invalidLexicons.cid, cidParam),
            eq(invalidLexicons.repoDid, repoDid),
          ),
        )
        .limit(1);

      if (invalidLexicon.length > 0) {
        return Response.json({
          data: invalidLexicon[0],
        });
      }

      // Not found
      return Response.json(
        {
          error: {
            code: "NOT_FOUND",
            message:
              "Lexicon not found with the specified NSID, CID, and repository DID",
          },
        },
        { status: 404 },
      );
    }

    // Without CID, return all versions from this repo + NSID
    const [
      validLexicons_results,
      invalidLexicons_results,
      validCount,
      invalidCount,
    ] = await Promise.all([
      db
        .select()
        .from(validLexicons)
        .where(
          and(eq(validLexicons.nsid, nsid), eq(validLexicons.repoDid, repoDid)),
        )
        .orderBy(desc(validLexicons.ingestedAt)),
      db
        .select()
        .from(invalidLexicons)
        .where(
          and(
            eq(invalidLexicons.nsid, nsid),
            eq(invalidLexicons.repoDid, repoDid),
          ),
        )
        .orderBy(desc(invalidLexicons.ingestedAt)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(validLexicons)
        .where(
          and(eq(validLexicons.nsid, nsid), eq(validLexicons.repoDid, repoDid)),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(invalidLexicons)
        .where(
          and(
            eq(invalidLexicons.nsid, nsid),
            eq(invalidLexicons.repoDid, repoDid),
          ),
        ),
    ]);

    // Merge and sort by ingestedAt
    const merged = [
      ...validLexicons_results.map((l) => ({ ...l, valid: true })),
      ...invalidLexicons_results.map((l) => ({ ...l, valid: false })),
    ].sort(
      (a, b) =>
        new Date(b.ingestedAt).getTime() - new Date(a.ingestedAt).getTime(),
    );

    const total = Number(validCount[0].count) + Number(invalidCount[0].count);

    return Response.json({
      data: merged,
      pagination: {
        limit: merged.length,
        offset: 0,
        total,
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ValidationError) {
      return error.toResponse();
    }

    console.error("Error resolving AT URI:", error);
    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to resolve AT URI",
        },
      },
      { status: 500 },
    );
  }
}
