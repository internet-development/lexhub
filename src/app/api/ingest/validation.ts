import { LexiconDoc, parseLexiconDoc } from "@atproto/lexicon";
import { InvalidLexiconReason } from "./reasons";
import { Commit, isZodError } from "./types";

export type ValidationResult =
  | {
      isValid: true;
      lexiconDoc: LexiconDoc;
      reasons: [];
    }
  | {
      isValid: false;
      reasons: InvalidLexiconReason[];
    };

type ValidatorFunction = (
  commit: Commit,
  reasons: InvalidLexiconReason[],
) => void;

/**
 * Validates that the NSID contains only allowed characters.
 * NSIDs can only contain ASCII letters, digits, dashes, and periods.
 */
const validateNsidFormat: ValidatorFunction = (commit, reasons) => {
  const nsid = commit.record.id;
  // NSID format: only ASCII letters, digits, dashes, and periods
  const validNsidPattern = /^[a-zA-Z0-9.-]+$/;
  
  if (!validNsidPattern.test(nsid)) {
    reasons.push({
      type: "invalid_nsid_format",
      nsid: nsid,
      message: "NSID contains disallowed characters (ASCII letters, digits, dashes, periods only)",
    });
  }
};

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
  validateNsidFormat,
  validateRkeyMatchesNsid,
  validateSchema,
  // Future validators can be added here
  // Example: validateNsidDidAuthority (currently done before validation)
];

/**
 * Validates a lexicon commit against all registered validators.
 * Collects all validation failures and returns them.
 *
 * @param commit - The commit data from a Nexus record event
 * @returns ValidationResult with isValid flag, reasons array, and optional lexiconDoc
 */
export function validateLexicon(commit: Commit): ValidationResult {
  const reasons: InvalidLexiconReason[] = [];

  for (const validator of validators) {
    validator(commit, reasons);
  }

  if (reasons.length === 0) {
    return {
      isValid: true,
      lexiconDoc: commit.record as unknown as LexiconDoc,
      reasons: [],
    };
  }

  return {
    isValid: false,
    reasons: reasons,
  };
}
