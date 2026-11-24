export const COUNTRY_OPTIONS = [
  { label: "Nigeria", code: "NG" },
  { label: "Ghana", code: "GH" },
  { label: "Kenya", code: "KE" },
  { label: "South Africa", code: "ZA" },
  { label: "Rwanda", code: "RW" },
  { label: "Uganda", code: "UG" },
] as const;

/** Kept so the existing "Other" option stays in the selector. It is not an ISO code and is never sent. */
export const OTHER_COUNTRY_CODE = "OTHER";

export type CountryCode = (typeof COUNTRY_OPTIONS)[number]["code"];

const SUPPORTED_COUNTRY_CODES = new Set<string>(COUNTRY_OPTIONS.map((country) => country.code));

export function isSupportedCountryCode(value: string): value is CountryCode {
  return SUPPORTED_COUNTRY_CODES.has(value);
}

export function getCountryLabel(code: string): string {
  const match = COUNTRY_OPTIONS.find((country) => country.code === code);
  if (match) return match.label;
  if (code === OTHER_COUNTRY_CODE) return "Other";
  return code;
}
