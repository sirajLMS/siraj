import { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/** A selectable routing purpose with its localized label. */
export interface WhatsappPurposeOption {
  readonly value: WhatsappAccountPurpose;
  readonly label: string;
}

type PurposeLabelKeys = Pick<WhatsappLabels, "purposeGeneral" | "purposeAdvertising" | "purposeStudents">;

/**
 * Ordered purpose options for the create/edit dialog selects, labeled from the
 * whatsapp locale namespace.
 */
export function getPurposeOptions(labels: PurposeLabelKeys): readonly WhatsappPurposeOption[] {
  return [
    { value: WhatsappAccountPurpose.General, label: labels.purposeGeneral },
    { value: WhatsappAccountPurpose.Advertising, label: labels.purposeAdvertising },
    { value: WhatsappAccountPurpose.Students, label: labels.purposeStudents },
  ];
}

const PURPOSE_VALUES: Readonly<Record<string, WhatsappAccountPurpose>> = {
  GENERAL: WhatsappAccountPurpose.General,
  ADVERTISING: WhatsappAccountPurpose.Advertising,
  STUDENTS: WhatsappAccountPurpose.Students,
};

const PURPOSE_LABEL_KEYS: Readonly<Record<string, string>> = {
  GENERAL: "purposeGeneral",
  ADVERTISING: "purposeAdvertising",
  STUDENTS: "purposeStudents",
} as const;

/**
 * Maps a `WhatsappAccountPurpose` value (or null/unknown) to its whatsapp
 * locale label key, falling back to the general label.
 */
export function getPurposeLabelKey(purpose: string | null): string {
  return PURPOSE_LABEL_KEYS[purpose ?? ""] ?? "purposeGeneral";
}

type PurposeLabelI18nKey = keyof PurposeLabelKeys;

function isPurposeLabelI18nKey(key: string): key is PurposeLabelI18nKey {
  return key === "purposeGeneral" || key === "purposeAdvertising" || key === "purposeStudents";
}

/**
 * Localized display label for a routing purpose (e.g. list/cell badges).
 * Falls back to the raw purpose value when it maps to no known label key.
 */
export function getPurposeLabel(labels: PurposeLabelKeys, purpose: string | null): string {
  const key = getPurposeLabelKey(purpose);
  if (isPurposeLabelI18nKey(key)) {
    return labels[key];
  }
  return purpose ?? "";
}

/**
 * Resolves a raw string (e.g. a select value) to its `WhatsappAccountPurpose`
 * member, or `undefined` when the string is not a known purpose. Guards avoid
 * the enum-cast lint rules.
 */
export function resolvePurposeValue(value: string): WhatsappAccountPurpose | undefined {
  return PURPOSE_VALUES[value];
}
