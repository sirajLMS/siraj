import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/** Masked-secret helper caption: stored-value indicator plus optional field guidance. */
export function secretHelper(storedMaskedValue: string | null, labels: WhatsappLabels, extraHelper: string): string {
  const storedPart = storedMaskedValue ? labels.configSecretStored(storedMaskedValue) : labels.configSecretNotSet;
  return extraHelper ? `${storedPart} ${extraHelper}` : storedPart;
}

/**
 * Appends the destructive-clear notice to a visible field's guidance: for
 * these fields an emptied input submits an explicit null, which REMOVES the
 * stored value on save (merge semantics of the mutation).
 */
export function clearableHelper(helper: string, clearHint: string): string {
  return `${helper} ${clearHint}`;
}
