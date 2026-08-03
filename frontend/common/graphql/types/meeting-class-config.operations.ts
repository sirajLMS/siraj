import type {
  MeetingProviderFieldsFragment,
  UserMeetingConfigFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/operations";
import type {
  ClassMeetingConfigCreateInput,
  ClassMeetingConfigUpdateInput,
  EffectiveMeetingSource,
} from "@/frontend/common/types/meeting-class-config.graphql.types";

/** Hand-written operation types until backend phase 0 codegen lands. */

export type ClassMeetingConfigFieldsFragment = Omit<UserMeetingConfigFieldsFragment, "userId"> & {
  readonly classInstanceId: string | null;
  readonly recurringScheduleId: string | null;
};

export type EffectiveMeetingFieldsFragment = {
  readonly joinUrl: string | null;
  readonly providerSlug: string | null;
  readonly providerName: Partial<Record<"ar" | "en", string>> | null;
  readonly logoUrl: string | null;
  readonly meetingId: string | null;
  readonly source: EffectiveMeetingSource | string | null;
  readonly configId: string | null;
  readonly providerId: string | null;
  readonly supportsAutoGeneration: boolean | null;
};

export type ClassMeetingConfigsQuery = {
  readonly classMeetingConfigs: Array<ClassMeetingConfigFieldsFragment> | null;
};

export type ClassMeetingConfigsQueryVariables = {
  readonly classInstanceId: string;
};

export type RecurringMeetingConfigsQuery = {
  readonly recurringMeetingConfigs: Array<ClassMeetingConfigFieldsFragment> | null;
};

export type RecurringMeetingConfigsQueryVariables = {
  readonly recurringScheduleId: string;
};

export type CreateClassMeetingConfigMutation = {
  readonly createClassMeetingConfig: ClassMeetingConfigFieldsFragment | null;
};

export type CreateClassMeetingConfigMutationVariables = {
  readonly input: ClassMeetingConfigCreateInput;
};

export type UpdateClassMeetingConfigMutation = {
  readonly updateClassMeetingConfig: ClassMeetingConfigFieldsFragment | null;
};

export type UpdateClassMeetingConfigMutationVariables = {
  readonly id: string;
  readonly input: ClassMeetingConfigUpdateInput;
};

export type DeleteClassMeetingConfigMutation = {
  readonly deleteClassMeetingConfig: boolean | null;
};

export type DeleteClassMeetingConfigMutationVariables = {
  readonly id: string;
};

export type SetDefaultClassMeetingConfigMutation = {
  readonly setDefaultClassMeetingConfig: ClassMeetingConfigFieldsFragment | null;
};

export type SetDefaultClassMeetingConfigMutationVariables = {
  readonly id: string;
};

export type MeetingConfigListItem = ClassMeetingConfigFieldsFragment | UserMeetingConfigFieldsFragment;

export type MeetingConfigSelectOption = {
  readonly id: string;
  readonly label: string | null;
  readonly provider: MeetingProviderFieldsFragment | null;
  readonly isDefault: boolean | null;
};
