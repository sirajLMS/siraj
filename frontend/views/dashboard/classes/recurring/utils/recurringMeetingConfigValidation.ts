import { isUrlAllowedByProvider } from "@/frontend/common/lib/meeting-config";
import type { RecurringMeetingConfigFormState } from "@/frontend/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";

export type RecurringMeetingConfigErrorKey = "incomplete" | "urlNotAllowed";

export function isRecurringMeetingConfigValid(state: RecurringMeetingConfigFormState): boolean {
  return getRecurringMeetingConfigErrorKey(state) === null;
}

export function getRecurringMeetingConfigErrorKey(
  state: RecurringMeetingConfigFormState
): RecurringMeetingConfigErrorKey | null {
  if (state.useTeacherDefault) return null;
  if (state.selectedConfig?.id) return null;

  const provider = state.newProvider;
  const meetingUrl = state.newMeetingUrl.trim();
  if (!provider?.id || !meetingUrl) {
    return "incomplete";
  }

  const allowlist = provider.urlAllowlist ?? [];
  if (allowlist.length > 0 && !isUrlAllowedByProvider(meetingUrl, allowlist)) {
    return "urlNotAllowed";
  }

  return null;
}

export function resolveRecurringMeetingConfigErrorMessage(
  key: RecurringMeetingConfigErrorKey | null,
  messages: { readonly recurringFieldsRequired: string; readonly urlNotAllowed: string }
): string | null {
  if (key === "incomplete") return messages.recurringFieldsRequired;
  if (key === "urlNotAllowed") return messages.urlNotAllowed;
  return null;
}
