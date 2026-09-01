import { LightbulbOutlined, ReportProblemOutlined } from "@mui/icons-material";
import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import type {
  FeedbackManageTabId,
  FeedbackManageTabLabelKey,
} from "@/frontend/common/views/dashboard/feedback/tabs/types";
import { getVisibleTabs, type TabDefinition } from "@/frontend/common/views/dashboard/lib/tabbedPane";

const FEEDBACK_MANAGE_TABS: readonly TabDefinition<FeedbackManageTabId, FeedbackManageTabLabelKey>[] = [
  {
    id: "complaints",
    labelKey: "complaints",
    permissions: PAGE_PERMISSIONS.feedbackComplaints,
    icon: ReportProblemOutlined,
  },
  {
    id: "suggestions",
    labelKey: "suggestions",
    permissions: PAGE_PERMISSIONS.feedbackSuggestions,
    icon: LightbulbOutlined,
  },
] as const;

export function getVisibleFeedbackManageTabs(
  hasPermission: (permission: AppPermission) => boolean
): TabDefinition<FeedbackManageTabId, FeedbackManageTabLabelKey>[] {
  return getVisibleTabs<FeedbackManageTabId, FeedbackManageTabLabelKey>(FEEDBACK_MANAGE_TABS, hasPermission);
}
