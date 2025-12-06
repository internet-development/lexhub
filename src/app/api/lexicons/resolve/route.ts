import { db } from "@/db";
import { invalid_lexicons, valid_lexicons } from "@/db/schema";
import { ValidationError } from "@/util/params";
import { IdResolver, MemoryCache } from "@atproto/identity";
import { AtUri, isValidHandle } from "@atproto/syntax";
import { and, desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

const MAX_LEXICONS_LIMIT = 500;

const idResolver = new IdResolver({ didCache: new MemoryCache() });

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
    db.query.valid_lexicons.findFirst({
      where: and(
        eq(valid_lexicons.nsid, nsid),
        eq(valid_lexicons.cid, cid),
        eq(valid_lexicons.repoDid, repoDid),
      ),
    }),
    db.query.invalid_lexicons.findFirst({
      where: and(
        eq(invalid_lexicons.nsid, nsid),
        eq(invalid_lexicons.cid, cid),
        eq(invalid_lexicons.repoDid, repoDid),
      ),
    }),
  ]);

  return validLexicon ?? invalidLexicon ?? null;
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
      .from(valid_lexicons)
      .where(
        and(eq(valid_lexicons.nsid, nsid), eq(valid_lexicons.repoDid, repoDid)),
      )
      .orderBy(desc(valid_lexicons.ingestedAt))
      .limit(MAX_LEXICONS_LIMIT),
    db
      .select()
      .from(invalid_lexicons)
      .where(
        and(
          eq(invalid_lexicons.nsid, nsid),
          eq(invalid_lexicons.repoDid, repoDid),
        ),
      )
      .orderBy(desc(invalid_lexicons.ingestedAt))
      .limit(MAX_LEXICONS_LIMIT),
    db.$count(
      valid_lexicons,
      and(eq(valid_lexicons.nsid, nsid), eq(valid_lexicons.repoDid, repoDid)),
    ),
    db.$count(
      invalid_lexicons,
      and(
        eq(invalid_lexicons.nsid, nsid),
        eq(invalid_lexicons.repoDid, repoDid),
      ),
    ),
  ]);

  const merged = [
    ...validLexicons_results.map((l) => ({ ...l, valid: true })),
    ...invalidLexicons_results.map((l) => ({ ...l, valid: false })),
  ].sort((a, b) => b.ingestedAt.getTime() - a.ingestedAt.getTime());

  const total = validCount + invalidCount;

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
      total,
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
