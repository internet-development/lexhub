import { parseLexiconDoc } from "@atproto/lexicon";
import z from "zod";
import { Commit } from "./types";

// ============================================================================
// Reason Types
// ============================================================================

interface BaseReason {
  type: string;
}

/**
 * Reason: Record key does not match the lexicon NSID
 */
interface RkeyMismatchReason extends BaseReason {
  type: "rkey_mismatch";
  expected: string;
  actual: string;
}

/**
 * Reason: Lexicon failed schema validation
 */
interface SchemaValidationReason extends BaseReason {
  type: "schema_validation_error";
  issues: z.ZodError["issues"];
}

/**
 * All possible validation failure reasons
 */
export type InvalidLexiconReason =
  | RkeyMismatchReason
  | SchemaValidationReason;

// ============================================================================
// Validation Result
// ============================================================================

export type ValidationResult = {
  isValid: boolean;
  reasons: InvalidLexiconReason[];
  lexiconDoc?: any; // LexiconDoc type from @atproto/lexicon
};

// ============================================================================
// Helper Functions
// ============================================================================

function isZodError(error: any): error is z.ZodError {
  if (error instanceof z.ZodError) return true;

  return (
    error &&
    typeof error === "object" &&
    "issues" in error &&
    Array.isArray(error.issues)
  );
}

// ============================================================================
// Validator Functions
// ============================================================================

type ValidatorFunction = (
  commit: Commit,
  reasons: InvalidLexiconReason[]
) => void;

/**
 * Validates that the record key (rkey) matches the lexicon NSID.
 * This is required because the rkey should always be the NSID for lexicon records.
 */
const validateRkeyMatchesNsid: ValidatorFunction = (commit, reasons) => {
  const nsid = commit.record.id;
  if (commit.rkey !== nsid) {
    reasons.push({
      type: "rkey_mismatch",
      expected: nsid,
      actual: commit.rkey,
    });
  }
};

/**
 * Validates the lexicon record against the ATProto lexicon schema using Zod.
 */
const validateSchema: ValidatorFunction = (commit, reasons) => {
  try {
    parseLexiconDoc(commit.record);
  } catch (error) {
    if (isZodError(error)) {
      reasons.push({
        type: "schema_validation_error",
        issues: error.issues,
      });
    }
  }
};

/**
 * Registry of all validators.
 * Validators are executed in order and all failures are collected.
 */
const validators: ValidatorFunction[] = [
  validateRkeyMatchesNsid,
  validateSchema,
  // Future validators can be added here
  // Example: validateNsidDidAuthority (currently done before validation)
];

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validates a lexicon commit against all registered validators.
 * Collects all validation failures and returns them.
 *
 * @param commit - The commit data from a Nexus record event
 * @returns ValidationResult with isValid flag, reasons array, and optional lexiconDoc
 */
export function validateLexicon(commit: Commit): ValidationResult {
  const reasons: InvalidLexiconReason[] = [];
  let lexiconDoc: any = undefined;

  // Run all validators to collect all possible reasons
  for (const validator of validators) {
    validator(commit, reasons);
  }

  // If valid, parse and return the lexicon doc
  if (reasons.length === 0) {
    try {
      lexiconDoc = parseLexiconDoc(commit.record);
    } catch (error) {
      // This shouldn't happen since schema validator passed,
      // but handle defensively
      console.error("Unexpected error after validation passed:", error);
    }
  }

  return {
    isValid: reasons.length === 0,
    reasons,
    lexiconDoc,
  };
}
