import { LexiconSchemaRecord } from "@/util/lexicon";

/**
 * Represents a commit from a Nexus record event
 */
export interface Commit {
  did: string;
  rev: string;
  collection: string;
  rkey: string;
  action: "create" | "update" | "delete";
  cid: string;
  live: boolean;
  record: LexiconSchemaRecord;
}

/**
 * User event from Nexus (not processed)
 */
interface UserEvent {
  id: number;
  type: "user";
  user: object;
}

/**
 * Record event from Nexus containing a commit
 */
interface RecordEvent {
  id: number;
  type: "record";
  record: Commit;
}

export type NexusEvent = UserEvent | RecordEvent;

export function isUserEvent(event: NexusEvent): event is UserEvent {
  return event.type === "user";
}

export function isRecordEvent(event: NexusEvent): event is RecordEvent {
  return event.type === "record";
}

export function isNexusEvent(obj: any): obj is NexusEvent {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "number" &&
    (obj.type === "user" || obj.type === "record")
  );
}
