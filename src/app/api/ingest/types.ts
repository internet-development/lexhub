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
 * Raw commit from Tap (unvalidated record)
 * Extends RecordEvent to ensure all required fields are present
 */
export interface RawCommit extends RecordEvent {
  cid: string
  record: Record<string, unknown>
}

/**
 * Commit with validated LexiconSchemaRecord
 */
export interface Commit extends RawCommit {
  record: LexiconSchemaRecord
}

/**
 * Type guard to check if a value is a LexiconSchemaRecord.
 */
export function isLexiconSchemaRecord(v: any): v is LexiconSchemaRecord {
  return v?.['$type'] === LEXICON_SCHEMA_NSID && Object.hasOwn(v, 'id')
}

export function isCommit(commit: RawCommit): commit is Commit {
  return isLexiconSchemaRecord(commit.record)
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
