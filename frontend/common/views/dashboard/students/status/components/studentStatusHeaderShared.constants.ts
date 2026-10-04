import type { SxProps, Theme } from "@mui/material";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";

export const ACTION_BUTTON_SX: SxProps<Theme> = theme => ({ borderRadius: theme.layout.radius.button });

const STATUS_BADGE_MAP: Record<string, string> = {
  [StudentStatus.Regular]: "regular",
  [StudentStatus.Suspended]: "suspended",
  [StudentStatus.OnLeave]: "on_leave",
  [StudentStatus.OnTrial]: "on_trial",
  [StudentStatus.Deactivated]: "deactivated",
};

export function getBadgeStatusKey(status: StudentStatus): string {
  return STATUS_BADGE_MAP[status] ?? "regular";
}
