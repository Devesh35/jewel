export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasString(
  value: unknown,
  key: string
): value is Record<string, string> {
  return isRecord(value) && typeof value[key] === "string";
}

export function hasNumber(
  value: unknown,
  key: string
): value is Record<string, number> {
  return (
    isRecord(value) &&
    typeof value[key] === "number" &&
    Number.isFinite(value[key] as number)
  );
}

export function isDateRangeQuery(
  value: unknown
): value is { startDate: number; endDate: number } {
  return (
    isRecord(value) &&
    hasNumber(value, "startDate") &&
    hasNumber(value, "endDate") &&
    (value.endDate as number) >= (value.startDate as number)
  );
}

export function isStringUnion<T extends readonly string[]>(
  value: unknown,
  allowed: T
): value is T[number] {
  return (
    typeof value === "string" && (allowed as readonly string[]).includes(value)
  );
}
