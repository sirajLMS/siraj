import { HistoryOutlined, SchoolOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, Tooltip, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { ActionIconLink } from "@/frontend/common/components/ui";
import { classHref, studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import {
  getPersonAccentColor,
  type PersonAccentTone,
} from "@/frontend/common/views/dashboard/admin/home/utils/scheduleCardHelpers";
import type { RecentApprovalCardLabels } from "@/frontend/common/views/dashboard/supervisor/dashboard/components/RecentApprovalCardList";
import type { MetaStatItem } from "@/frontend/common/views/dashboard/supervisor/dashboard/components/RecentApprovalCardList.helpers";
import { StyledCardActions } from "@/frontend/common/views/dashboard/supervisor/dashboard/components/RecentApprovalCardList.styles";
import type { RecentApproval } from "@/frontend/common/views/dashboard/supervisor/dashboard/types/supervisorDashboardTypes";

const StyledMetaPanel = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "stretch",
  marginBottom: theme.spacing(1.5),
  borderRadius: theme.layout.radius.card,
  backgroundColor: alpha(theme.palette.onSurface, 0.03),
  border: `1px solid ${theme.palette.border.light}`,
  overflow: "hidden",
}));

const StyledMetaTile = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  padding: theme.spacing(1.25, 1),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: theme.spacing(0.375),
  "&:not(:last-child)": {
    borderInlineEnd: `1px solid ${theme.palette.border.light}`,
  },
}));

const StyledMetaLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  width: "100%",
}));

const StyledMetaValue = styled(Typography, {
  shouldForwardProp: prop => prop !== "tone",
})<{ tone?: PersonAccentTone }>(({ theme, tone = "default" }) => ({
  color: getPersonAccentColor(tone, theme),
  fontFamily: "monospace",
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  width: "100%",
}));

export function ApprovalMetaStatBar({ items }: { readonly items: readonly MetaStatItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <StyledMetaPanel>
      {items.map(item => (
        <StyledMetaTile key={item.label}>
          <StyledMetaLabel variant="labelMd" title={item.label}>
            {item.label}
          </StyledMetaLabel>
          <StyledMetaValue variant="bodyMd" tone={item.tone}>
            {item.value}
          </StyledMetaValue>
        </StyledMetaTile>
      ))}
    </StyledMetaPanel>
  );
}

export function RecentApprovalCardActions({
  item,
  labels,
}: {
  readonly item: RecentApproval;
  readonly labels: RecentApprovalCardLabels;
}) {
  const reportId = item.id;
  const studentId = item.studentId || undefined;
  const classInstanceId = item.classInstanceId || undefined;

  return (
    <StyledCardActions>
      {reportId ? (
        <Tooltip title={labels.viewReport}>
          <ActionIconLink href={`/lesson-reports/${reportId}`} aria-label={labels.viewReport}>
            <VisibilityOutlined fontSize="small" />
          </ActionIconLink>
        </Tooltip>
      ) : null}
      {studentId ? (
        <Tooltip title={labels.history}>
          <ActionIconLink href={studentProfileTabHref(studentId, "history")} aria-label={labels.history}>
            <HistoryOutlined fontSize="small" />
          </ActionIconLink>
        </Tooltip>
      ) : null}
      {classInstanceId ? (
        <Tooltip title={labels.viewClass}>
          <ActionIconLink href={classHref(classInstanceId)} aria-label={labels.viewClass}>
            <SchoolOutlined fontSize="small" />
          </ActionIconLink>
        </Tooltip>
      ) : null}
    </StyledCardActions>
  );
}
