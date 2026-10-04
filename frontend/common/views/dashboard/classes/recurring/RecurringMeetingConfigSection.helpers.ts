import type { MeetingConfigSelectOption } from "@/frontend/common/components/ui/input/meetingConfigSelect/types";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { RecurringMeetingConfigFormState } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";

export type RecurringMeetingConfigMode = "default" | "existing" | "new";

export function toSelectOption(config: UserMeetingConfigFieldsFragment): MeetingConfigSelectOption {
  return {
    id: config.id ?? "",
    label: config.label,
    provider: config.provider ?? null,
    isDefault: config.isDefault ?? false,
  };
}

export function resolveMode(value: RecurringMeetingConfigFormState): RecurringMeetingConfigMode {
  if (value.useTeacherDefault) {
    return "default";
  }
  if (value.selectedConfig) {
    return "existing";
  }
  return "new";
}
