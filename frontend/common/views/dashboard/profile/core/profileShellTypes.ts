import type { ReactNode } from "react";
import type { ProfileAudience, ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";

export type ProfileShellProps = {
  readonly loading?: boolean;
  readonly error?: string | null;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly audience: ProfileAudience;
  readonly scope: ProfileScope;
  readonly mode?: ProfileMode;
  readonly currentTab?: string;
  readonly onTabChange?: (tab: string) => void;
  readonly onRetry?: () => void;
  readonly name?: string;
  readonly email?: string;
  readonly roleLabel?: string;
  readonly avatarUrl?: string | null;
};
