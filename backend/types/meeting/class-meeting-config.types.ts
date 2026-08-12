import type {
  MeetingConfigBaseInsertType,
  MeetingConfigBaseReturnType,
  MeetingConfigBaseSelectType,
  MeetingConfigBaseSubmitInput,
} from "@/backend/types/meeting/meeting-config-base.types";
import type { LocalizedString } from "@/shared/types";

export type ClassMeetingConfigScope = "class_instance" | "recurring_schedule";

export type ClassMeetingConfigSelectType = MeetingConfigBaseSelectType & {
  readonly classInstanceId: string | null;
  readonly recurringScheduleId: string | null;
};

export type ClassMeetingConfigInsertType = MeetingConfigBaseInsertType & {
  readonly classInstanceId?: string | null;
  readonly recurringScheduleId?: string | null;
};

export type ClassMeetingConfigReturnType = MeetingConfigBaseReturnType & {
  readonly classInstanceId: string | null;
  readonly recurringScheduleId: string | null;
};

export type ClassMeetingConfigSubmitInput = MeetingConfigBaseSubmitInput & {
  readonly classInstanceId?: string | null;
  readonly recurringScheduleId?: string | null;
};

export type UpdateClassMeetingConfigInput = Partial<
  Omit<ClassMeetingConfigSubmitInput, "classInstanceId" | "recurringScheduleId">
>;

export type EffectiveMeetingSource = "class" | "recurring" | "teacher" | "none";

export type EffectiveMeetingReturnType = {
  readonly joinUrl: string | null;
  readonly providerSlug: string | null;
  readonly providerName: LocalizedString | null;
  readonly logoUrl: string | null;
  readonly meetingId: string | null;
  readonly source: EffectiveMeetingSource;
  readonly configId: string | null;
  readonly providerId: string | null;
  readonly supportsAutoGeneration: boolean;
};
