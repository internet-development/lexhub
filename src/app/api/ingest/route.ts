import { NextRequest, NextResponse } from "next/server";

interface UserEvent {
  id: number;
  type: "user";
  user: object;
}

interface RecordEvent {
  id: number;
  type: "record";
  record: object;
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    /* NOTE(caidanw):
     * Nexus sends a variety of event types: 'user' events and 'record' events.
     * Nexus always includes 'user' events, currently no way to configure this.
     * We only want to process 'record' events.
     */
    if (!isNexusEvent(body) || isUserEvent(body)) {
      return new NextResponse(null, { status: 200 });
    }

    // TODO(@elijaharita)
    console.log("Received data:", body);

    return NextResponse.json(
      {
        success: true,
        message: "Data ingested successfully",
        data: body,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error processing ingest request:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
      },
      { status: 400 },
    );
  }
}
