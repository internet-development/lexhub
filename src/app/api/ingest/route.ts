import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { invalidLexicons, validLexicons } from "@/db/schema";
import { isLexiconSchemaRecord, LexiconSchemaRecord } from "@/util/lexicon";
import { LexiconDoc, parseLexiconDoc } from "@atproto/lexicon";
import { resolveLexiconDidAuthority } from "@atproto/lexicon-resolver";
import z from "zod";

interface UserEvent {
  id: number;
  type: "user";
  user: object;
}

interface RecordEvent {
  id: number;
  type: "record";
  record: {
    did: string;
    rev: string;
    collection: string;
    rkey: string;
    action: "create" | "update" | "delete";
    cid: string;
    live: boolean;
    record: LexiconSchemaRecord;
  };
}

type NexusEvent = UserEvent | RecordEvent;

function isUserEvent(event: NexusEvent): event is UserEvent {
  return event.type === "user";
}

function isRecordEvent(event: NexusEvent): event is RecordEvent {
  return event.type === "record";
}

function isNexusEvent(obj: any): obj is NexusEvent {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "number" &&
    (obj.type === "user" || obj.type === "record")
  );
}

function isZodError(error: any): error is z.ZodError {
  if (error instanceof z.ZodError) return true;

  // Check for ZodError shape, since instanceof may fail when ZodError is nested in another error
  return (
    error &&
    typeof error === "object" &&
    "issues" in error &&
    Array.isArray(error.issues)
  );
}

/**
 * Acknowledges receipt of a Nexus event.
 * Nexus considers events 'acked' when it receives a 200 response.
 */
function ackEvent(body?: BodyInit) {
  return new NextResponse(body, { status: 200 });
}

/**
 * Signals to Nexus that the event should be sent again later.
 * Nexus will retry events that receive any response other than 200.
 *
 * This should be used sparingly to avoid excessive retries.
 */
function retryEvent(body?: BodyInit) {
  return new NextResponse(body, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    /* NOTE(caidanw):
     * Nexus sends a variety of event types: 'user' events and 'record' events.
     * Nexus always includes 'user' events, currently no way to configure this.
     * We only want to process 'record' events.
     */
    if (!isNexusEvent(body) || isUserEvent(body)) {
      return ackEvent("Event type not desired");
    }

    const commit = body.record;
    const { cid, record: lexiconRecord } = commit;

    if (!isLexiconSchemaRecord(lexiconRecord)) {
      return ackEvent("Not a valid lexicon schema record");
    }

    const nsid = lexiconRecord.id;
    const did = await resolveLexiconDidAuthority(nsid);

    // DNS validation gate: Reject if DNS doesn't resolve or doesn't match the repo DID
    // This helps prevent spoofing and DDoS attacks by only storing lexicons with valid DNS authority
    if (!did || did !== commit.did) {
      return ackEvent("NSID DID authority does not match record DID");
    }

    try {
      // Attempt to parse and validate the lexicon schema
      const lexiconDoc = parseLexiconDoc(lexiconRecord);

      // Valid lexicon: store in valid_lexicons table
      await db
        .insert(validLexicons)
        .values({
          nsid: nsid,
          cid: cid,
          repoDid: commit.did,
          repoRev: commit.rev,
          data: lexiconDoc,
        })
        .onConflictDoNothing();

      console.log("Valid lexicon ingested:", {
        eventId: body.id,
        nsid: nsid,
        cid: cid,
        repoDid: commit.did,
        action: commit.action,
      });

      return ackEvent("Valid lexicon ingested successfully");
    } catch (error) {
      if (isZodError(error)) {
        // Invalid lexicon: store in invalid_lexicons table for debugging
        await db
          .insert(invalidLexicons)
          .values({
            nsid: nsid,
            cid: cid,
            repoDid: commit.did,
            repoRev: commit.rev,
            rawData: lexiconRecord,
            validationErrors: error.issues,
          })
          .onConflictDoNothing();

        console.warn("Invalid lexicon ingested:", {
          eventId: body.id,
          nsid: nsid,
          cid: cid,
          repoDid: commit.did,
          errorCount: error.issues.length,
        });

        return ackEvent("Invalid lexicon stored for debugging");
      } else {
        console.error("Unknown error while parsing lexicon record:", error);
        return ackEvent("Lexicon record failed to parse");
      }
    }
  } catch (error) {
    console.error("Error processing ingest request:", error);

    // Always acknowledge events that cause unknown errors to prevent potential loops
    return ackEvent("Failed to process request");
  }
}
