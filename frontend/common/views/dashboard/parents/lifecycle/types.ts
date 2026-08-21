import type { AccountStatus, ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql";

export type { AccountStatus, ParentStatus };

export type ParentLifecyclePageData = {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly lifecycleStatus: ParentStatus;
  readonly accountStatus: AccountStatus;
  readonly avatarUrl: string | null;
};

export type ParentLifecycleViewProps = {
  readonly parent: ParentLifecyclePageData;
  readonly isUpdating: boolean;
  readonly onUpdateLifecycle: (status: ParentStatus, reason: string) => Promise<void>;
};
