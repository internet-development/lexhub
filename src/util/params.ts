export class ValidationError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }

  toResponse(status = 400): Response {
    return Response.json(
      { error: { code: this.code, message: this.message } },
      { status },
    );
  }
}

// Only accepts explicit "true" or "false" strings to avoid ambiguous truthy/falsy behavior
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

// Clamps to min/max instead of throwing to provide better UX (avoids rejecting valid requests)
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

  let clamped = parsed;
  if (options?.min !== undefined && clamped < options.min) {
    clamped = options.min;
  }
  if (options?.max !== undefined && clamped > options.max) {
    clamped = options.max;
  }

  return clamped;
}
