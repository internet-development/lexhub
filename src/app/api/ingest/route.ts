import { NextRequest, NextResponse } from "next/server";

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
    record: object;
    live: boolean;
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

    // TODO(@elijaharita)
    console.log("Received data:", body);

    return ackEvent("Event ingested successfully");
  } catch (error) {
    console.error("Error processing ingest request:", error);

    // Always acknowledge events that cause unknown errors to prevent potential loops
    return ackEvent("Failed to process request");
  }
}
