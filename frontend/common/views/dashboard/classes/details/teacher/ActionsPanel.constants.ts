import DeleteIcon from "@mui/icons-material/Delete";
import EditNoteIcon from "@mui/icons-material/EditNote";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import type { ElementType } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";

interface ActionConfig {
  readonly key: string;
  readonly icon: ElementType;
  readonly statusKey: "active" | "cancelled" | "completed";
  readonly permission?: AppPermission;
}

export const ACTION_CONFIGS: ActionConfig[] = [
  {
    key: "activate",
    icon: PowerSettingsNewIcon,
    statusKey: "active",
    permission: AppPermission.SessionActivateClass,
  },
  {
    key: "stop",
    icon: PauseCircleIcon,
    statusKey: "cancelled",
    permission: AppPermission.SessionOverrideActions,
  },
  {
    key: "infoEdit",
    icon: EditNoteIcon,
    statusKey: "completed",
  },
  {
    key: "delete",
    icon: DeleteIcon,
    statusKey: "cancelled",
    permission: AppPermission.SessionOverrideActions,
  },
];
