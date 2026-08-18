import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";

export type MeetingConfigSelectOption = {
  readonly id: string;
  readonly label: string | null;
  readonly provider: MeetingProviderFieldsFragment | null;
  readonly isDefault: boolean | null;
};
