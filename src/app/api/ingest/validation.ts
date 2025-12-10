import { LexiconDoc, parseLexiconDoc } from "@atproto/lexicon";
import { resolveLexiconDidAuthority } from "@atproto/lexicon-resolver";
import { validateNsid } from "@atproto/syntax";
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
) => void | Promise<void>;

/**
 * Validates that the NSID format is correct.
 * Uses @atproto/syntax validateNsid for detailed validation messages.
 */
const validateNsidFormat: ValidatorFunction = (commit, reasons) => {
  const nsid = commit.record.id;
  const result = validateNsid(nsid);

  if (!result.success) {
    reasons.push({
      type: "invalid_nsid_format",
      nsid: nsid,
      message: result.message,
    });
  }
};

/**
 * Validates that the NSID DID authority matches the repository DID.
 * This helps prevent spoofing and DDoS attacks by only storing lexicons with valid DNS authority.
 */
const validateDidAuthority: ValidatorFunction = async (commit, reasons) => {
  const nsid = commit.record.id;

  try {
    const expectedDid = await resolveLexiconDidAuthority(nsid);

    if (!expectedDid || expectedDid !== commit.did) {
      reasons.push({
        type: "did_authority_mismatch",
        nsid: nsid,
        expectedDid: expectedDid || null,
        actualDid: commit.did,
      });
    }
  } catch (error) {
    // If DNS resolution fails, treat it as a mismatch
    reasons.push({
      type: "did_authority_mismatch",
      nsid: nsid,
      expectedDid: null,
      actualDid: commit.did,
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
    if (!isZodError(error)) throw error;

    reasons.push({
      type: "schema_validation_error",
      issues: error.issues,
    });
  }
};

/**
 * Registry of all validators.
 * Validators are executed in order and all failures are collected.
 */
const validators: ValidatorFunction[] = [
  validateNsidFormat,
  validateDidAuthority,
  validateRkeyMatchesNsid,
  validateSchema,
];

/**
 * Validates a lexicon commit against all registered validators.
 * Collects all validation failures and returns them.
 *
 * @param commit - The commit data from a Nexus record event
 * @returns ValidationResult with isValid flag, reasons array, and optional lexiconDoc
 */
export async function validateLexicon(
  commit: Commit,
): Promise<ValidationResult> {
  const reasons: InvalidLexiconReason[] = [];

  for (const validator of validators) {
    await validator(commit, reasons);
  }

  if (reasons.length === 0) {
    return {
      isValid: true,
      /* NOTE(caidanw):
       * Safe to parse again since all validations passed.
       * In the future we may want to refactor the validators to use a shared context object.
       * For now, this is simpler and performance impact is negligible.
       */
      lexiconDoc: parseLexiconDoc(commit.record),
      reasons: [],
    };
  }

  return {
    isValid: false,
    reasons: reasons,
  };
}
