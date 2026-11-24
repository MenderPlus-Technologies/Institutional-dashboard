export const INSTITUTION_TYPE_OPTIONS = [
  { label: "NGO", value: "ngo" },
  { label: "Corporate", value: "corporate" },
  { label: "Government", value: "government" },
  { label: "Faith-based", value: "faith_based" },
  { label: "Cooperative", value: "cooperative" },
  { label: "Other", value: "other" },
] as const;

export type InstitutionType = (typeof INSTITUTION_TYPE_OPTIONS)[number]["value"];

/** Values accepted as `institution.type` on POST /api/institution-auth/register. */
export const INSTITUTION_TYPE_TO_API = {
  ngo: "ngo",
  corporate: "corporate",
  government: "government",
  faith_based: "faith_based",
  cooperative: "cooperative",
  other: "other",
} as const satisfies Record<InstitutionType, string>;

const INSTITUTION_TYPES = new Set<string>(INSTITUTION_TYPE_OPTIONS.map((option) => option.value));

export function isInstitutionType(value: string): value is InstitutionType {
  return INSTITUTION_TYPES.has(value);
}

export function toInstitutionApiType(value: InstitutionType): string {
  return INSTITUTION_TYPE_TO_API[value];
}

export function getInstitutionTypeLabel(value: string): string {
  return INSTITUTION_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
