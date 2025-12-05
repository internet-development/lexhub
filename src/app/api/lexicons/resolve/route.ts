import type { NextRequest } from "next/server";
import { db } from "@/db";
import { validLexicons, invalidLexicons } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { AtUri, isValidHandle } from "@atproto/syntax";
import { IdResolver } from "@atproto/identity";
import { ValidationError } from "@/util/params";

const MAX_LEXICONS_LIMIT = 500;
const idResolver = new IdResolver();

async function parseAndValidateUri(uriParam: string) {
  let atUri: AtUri;
  try {
    atUri = new AtUri(uriParam);
  } catch (error) {
    throw new ValidationError("INVALID_AT_URI", "Invalid AT URI format");
  }

  if (!atUri.collection || !atUri.rkey) {
    throw new ValidationError(
      "INVALID_AT_URI_PATH",
      "AT URI must include collection and record key",
    );
  }

  const nsid = atUri.rkey;
  const repoDid = await resolveHostnameToDid(atUri.hostname);

  return { nsid, repoDid };
}

async function resolveHostnameToDid(hostname: string): Promise<string> {
  if (!isValidHandle(hostname)) {
    return hostname;
  }

  const resolvedDid = await idResolver.handle.resolve(hostname);
  if (!resolvedDid) {
    throw new ValidationError(
      "HANDLE_NOT_FOUND",
      `Could not resolve handle: ${hostname}`,
    );
  }

  return resolvedDid;
}

async function querySingleLexicon(nsid: string, cid: string, repoDid: string) {
  const [validLexicon, invalidLexicon] = await Promise.all([
    db
      .select()
      .from(validLexicons)
      .where(
        and(
          eq(validLexicons.nsid, nsid),
          eq(validLexicons.cid, cid),
          eq(validLexicons.repoDid, repoDid),
        ),
      )
      .limit(1),
    db
      .select()
      .from(invalidLexicons)
      .where(
        and(
          eq(invalidLexicons.nsid, nsid),
          eq(invalidLexicons.cid, cid),
          eq(invalidLexicons.repoDid, repoDid),
        ),
      )
      .limit(1),
  ]);

  return validLexicon[0] || invalidLexicon[0] || null;
}

async function queryAllVersions(nsid: string, repoDid: string) {
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
      .orderBy(desc(validLexicons.ingestedAt))
      .limit(MAX_LEXICONS_LIMIT),
    db
      .select()
      .from(invalidLexicons)
      .where(
        and(
          eq(invalidLexicons.nsid, nsid),
          eq(invalidLexicons.repoDid, repoDid),
        ),
      )
      .orderBy(desc(invalidLexicons.ingestedAt))
      .limit(MAX_LEXICONS_LIMIT),
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

  const merged = [
    ...validLexicons_results.map((l) => ({ ...l, valid: true })),
    ...invalidLexicons_results.map((l) => ({ ...l, valid: false })),
  ].sort((a, b) => b.ingestedAt.getTime() - a.ingestedAt.getTime());

  const total = Number(validCount[0].count) + Number(invalidCount[0].count);

  return { data: merged, total };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const uriParam = searchParams.get("uri");
    const cidParam = searchParams.get("cid");

    if (!uriParam) {
      throw new ValidationError("MISSING_URI", "URI parameter is required");
    }

    const { nsid, repoDid } = await parseAndValidateUri(uriParam);

    if (cidParam) {
      const lexicon = await querySingleLexicon(nsid, cidParam, repoDid);

      if (!lexicon) {
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

      return Response.json({ data: lexicon });
    }

    const { data, total } = await queryAllVersions(nsid, repoDid);

    return Response.json({
      data,
      pagination: {
        limit: data.length,
        offset: 0,
        total,
      },
    });
  } catch (error) {
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
