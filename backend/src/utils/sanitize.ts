import xss from "xss";

export function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") return xss(value.trim());
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, sanitizeValue(val)]));
  }
  return value;
}
