import type z from "zod";

interface BaseReason {
  type: string;
}

/**
 * NSID format is invalid
 */
interface InvalidNsidFormatReason extends BaseReason {
  type: "invalid_nsid_format";
  nsid: string;
  message: string;
}

/**
 * NSID DID authority does not match the repository DID
 */
interface DidAuthorityMismatchReason extends BaseReason {
  type: "did_authority_mismatch";
  nsid: string;
  expectedDid: string | null;
  actualDid: string;
}

/**
 * Record key does not match the lexicon NSID
 */
interface RkeyMismatchReason extends BaseReason {
  type: "rkey_mismatch";
  expected: string;
  actual: string;
}

/**
 * Lexicon failed schema validation
 */
interface SchemaValidationReason extends BaseReason {
  type: "schema_validation_error";
  issues: z.ZodError["issues"];
}

/**
 * All possible validation failure reasons
 */
export type InvalidLexiconReason =
  | InvalidNsidFormatReason
  | DidAuthorityMismatchReason
  | RkeyMismatchReason
  | SchemaValidationReason;
