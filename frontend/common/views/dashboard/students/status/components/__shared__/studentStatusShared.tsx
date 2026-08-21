import { Box, Paper, Typography } from "@mui/material";
import type { ComponentType } from "react";
import { panelCardPaperSx } from "@/frontend/common/components/ui/container/__shared__/panelCardSxShared";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { useStudentStatusLabels } from "@/frontend/common/views/dashboard/students/status/useStudentStatusLabels";

const STATUS_BADGE_MAP: Record<string, string> = {
  [StudentStatus.Regular]: "regular",
  [StudentStatus.Suspended]: "suspended",
  [StudentStatus.OnLeave]: "on_leave",
  [StudentStatus.OnTrial]: "on_trial",
  [StudentStatus.Deactivated]: "deactivated",
};

function getBadgeStatusKey(status: StudentStatus): string {
  return STATUS_BADGE_MAP[status] ?? "regular";
}

export interface StatusBadgeSlotProps {
  readonly category: "studentAccount";
  readonly status: string;
  readonly label: string;
}

export interface ReadOnlyStatusCardSharedOptions {
  readonly StatusBadge: ComponentType<StatusBadgeSlotProps>;
  readonly headerSxPadding: { readonly px: number; readonly py: number; readonly p: number };
  readonly titleVariant: "titleLg" | undefined;
  readonly titleSxTypography: string | undefined;
}

export function ReadOnlyStatusCardShared({
  status,
  options,
}: Readonly<{ readonly status: StudentStatus; readonly options: ReadOnlyStatusCardSharedOptions }>) {
  const t = useStudentStatusLabels();
  const { StatusBadge, headerSxPadding, titleVariant, titleSxTypography } = options;

  return (
    <Paper elevation={0} sx={theme => panelCardPaperSx(theme)}>
      <Box
        sx={theme => ({
          px: headerSxPadding.px,
          py: headerSxPadding.py,
          borderBottom: `1px solid ${theme.palette.border.main}`,
          backgroundColor: theme.palette.background.default,
        })}
      >
        <Typography
          {...(titleVariant ? { variant: titleVariant } : {})}
          sx={theme => ({
            ...(titleSxTypography ? { typography: titleSxTypography } : {}),
            color: theme.palette.primary.main,
            fontWeight: 700,
          })}
        >
          {t.fields.accountStatus}
        </Typography>
      </Box>
      <Box sx={{ p: headerSxPadding.p }}>
        <StatusBadge category="studentAccount" status={getBadgeStatusKey(status)} label={t.statusOptions[status]} />
      </Box>
    </Paper>
  );
}
