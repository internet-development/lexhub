import type z from "zod";

interface BaseReason {
  type: string;
}

/**
 *  Record key does not match the lexicon NSID
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
 * NSID format is invalid
 */
interface InvalidNsidFormatReason extends BaseReason {
  type: "invalid_nsid_format";
  nsid: string;
  message: string;
}

/**
 * All possible validation failure reasons
 */
export type InvalidLexiconReason =
  | RkeyMismatchReason
  | SchemaValidationReason
  | InvalidNsidFormatReason;
