import { LEXICON_SCHEMA_NSID } from '@atproto/lexicon-resolver'
import { RecordEvent } from '@atproto/tap'
import z from 'zod'

/**
 * Extend the type from `@atproto/lexicon-resolver` to require the 'id' field.
 * This extension is necessary because we need the NSID to resolve the DID authority.
 */
export type LexiconSchemaRecord = {
  $type: typeof LEXICON_SCHEMA_NSID
  id: string
}

/**
 * A RecordEvent that contains a lexicon schema record.
 * Narrows RecordEvent to ensure cid and record fields are present and typed as a lexicon.
 * Note: This does NOT mean the lexicon has been validated - use validateLexicon() for that.
 */
export type LexiconRecordEvent = RecordEvent & {
  cid: string
  record: LexiconSchemaRecord
}

/**
 * Type guard to check if a value is a LexiconSchemaRecord.
 */
export function isLexiconSchemaRecord(v: any): v is LexiconSchemaRecord {
  return v?.['$type'] === LEXICON_SCHEMA_NSID && Object.hasOwn(v, 'id')
}

/**
 * Type guard to check if a RecordEvent contains a lexicon.
 */
export function isLexiconRecordEvent(
  event: RecordEvent,
): event is LexiconRecordEvent {
  return !!event.cid && !!event.record && isLexiconSchemaRecord(event.record)
}

export function isZodError(error: any): error is z.ZodError {
  if (error instanceof z.ZodError) return true

  return (
    error &&
    typeof error === 'object' &&
    'issues' in error &&
    Array.isArray(error.issues)
  )
}
