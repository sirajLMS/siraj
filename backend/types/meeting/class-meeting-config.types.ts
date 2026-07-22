import type { MeetingConfigDetails } from "@/backend/types/meeting/meeting-config.types";
import type { MeetingProviderSelectType } from "@/backend/types/meeting/meeting-provider.types";
import type { LocalizedString } from "@/shared/types";

export type ClassMeetingConfigScope = "class_instance" | "recurring_schedule";

export type ClassMeetingConfigSelectType = {
  readonly id: string;
  readonly classInstanceId: string | null;
  readonly recurringScheduleId: string | null;
  readonly providerId: string;
  readonly label: string | null;
  readonly isDefault: boolean;
  readonly details: MeetingConfigDetails;
  readonly encryptedSecret: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ClassMeetingConfigInsertType = {
  readonly id?: string;
  readonly classInstanceId?: string | null;
  readonly recurringScheduleId?: string | null;
  readonly providerId: string;
  readonly label?: string | null;
  readonly isDefault: boolean;
  readonly details: MeetingConfigDetails;
  readonly encryptedSecret?: string | null;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
};

export type ClassMeetingConfigReturnType = ClassMeetingConfigSelectType & {
  readonly hasSecret?: boolean;
  readonly provider?: MeetingProviderSelectType;
};

export type ClassMeetingConfigSubmitInput = Omit<
  ClassMeetingConfigInsertType,
  "id" | "createdAt" | "updatedAt" | "encryptedSecret"
> & {
  readonly password?: string | null;
};

export type UpdateClassMeetingConfigInput = Partial<
  Omit<ClassMeetingConfigSubmitInput, "classInstanceId" | "recurringScheduleId" | "providerId">
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
};
