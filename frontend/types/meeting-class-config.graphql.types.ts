/** Expected GraphQL input/enum shapes until backend phase 0 codegen lands. */

export enum EffectiveMeetingSource {
  Class = "class",
  Recurring = "recurring",
  Teacher = "teacher",
  None = "none",
}

export type MeetingConfigDetailsInput = {
  readonly meetingUrl: string;
  readonly username?: string | null;
  readonly tenantId?: string | null;
};

export type ClassMeetingConfigCreateInput = {
  readonly classInstanceId?: string | null;
  readonly recurringScheduleId?: string | null;
  readonly providerId: string;
  readonly label?: string | null;
  readonly isDefault: boolean;
  readonly password?: string | null;
  readonly details: MeetingConfigDetailsInput;
};

export type ClassMeetingConfigUpdateInput = {
  readonly providerId?: string | null;
  readonly label?: string | null;
  readonly isDefault?: boolean | null;
  readonly password?: string | null;
  readonly details?: MeetingConfigDetailsInput | null;
};
