// Custom error class for validation errors
export class ValidationError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Parse and validate a boolean query parameter
 * @param searchParams - URLSearchParams object
 * @param paramName - Name of the parameter
 * @param defaultValue - Default value if parameter is not provided
 * @returns Validated boolean value
 * @throws ValidationError if parameter is not "true" or "false"
 */
export function parseBooleanParam(
  searchParams: URLSearchParams,
  paramName: string,
  defaultValue: boolean,
): boolean {
  const value = searchParams.get(paramName);

  if (value === null) {
    return defaultValue;
  }

  if (value !== "true" && value !== "false") {
    throw new ValidationError(
      `INVALID_${paramName.toUpperCase()}_PARAM`,
      `${paramName} parameter must be either 'true' or 'false'`,
    );
  }

  return value === "true";
}

/**
 * Parse and validate an integer query parameter
 * @param searchParams - URLSearchParams object
 * @param paramName - Name of the parameter
 * @param defaultValue - Default value if parameter is not provided
 * @param options - Validation options (min, max) - values will be clamped to range
 * @returns Validated and clamped integer value
 * @throws ValidationError if parameter is not a valid integer
 */
export function parseIntegerParam(
  searchParams: URLSearchParams,
  paramName: string,
  defaultValue: number,
  options?: { min?: number; max?: number },
): number {
  const value = searchParams.get(paramName);
  if (value === null) {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new ValidationError(
      `INVALID_${paramName.toUpperCase()}`,
      `${paramName} must be a valid integer`,
    );
  }

  // Clamp to min/max range
  let clamped = parsed;
  if (options?.min !== undefined && clamped < options.min) {
    clamped = options.min;
  }
  if (options?.max !== undefined && clamped > options.max) {
    clamped = options.max;
  }

  return clamped;
}
