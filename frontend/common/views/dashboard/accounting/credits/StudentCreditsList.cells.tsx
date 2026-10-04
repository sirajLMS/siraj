"use client";

import { ChevronRightOutlined } from "@mui/icons-material";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { PersonProfileLinkCell } from "@/frontend/common/components/ui/display/personProfileLink/PersonProfileLinkCell";
import { studentHref } from "@/frontend/common/utils/profileHref";
import { rtlFlipIconSx } from "@/frontend/common/utils/rtlFlipIconSx";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import {
  buildAdjustHref,
  creditBalanceStatus,
} from "@/frontend/common/views/dashboard/accounting/credits/StudentCreditsList.helpers";
import { adjustActionSx } from "@/frontend/common/views/dashboard/accounting/credits/StudentCreditsList.styles";
import type { StudentCreditsRow } from "@/frontend/common/views/dashboard/accounting/credits/StudentCreditsList.types";
import { useRouter } from "@/shared/i18n/navigation";

export function StudentCell({ row }: Readonly<{ row: StudentCreditsRow }>) {
  return (
    <Box sx={{ minWidth: 0, width: "100%" }}>
      <PersonProfileLinkCell
        href={row.id === null ? null : studentHref(row.id)}
        name={row.name ?? "—"}
        avatarUrl={row.avatarUrl}
        avatarSize={32}
        typographyVariant="bodyMd"
        fontWeight={600}
      />
    </Box>
  );
}

/** Renders the assigned teacher; an empty value stays a muted dash so it reads as "no data" instead of an error. */
export function TeacherCell({ teacherName }: Readonly<{ teacherName: string | null }>) {
  if (teacherName === null || teacherName === "") {
    return (
      <Typography
        sx={theme => ({ fontSize: 13, color: theme.palette.onSurfaceVariant, width: "100%", textAlign: "center" })}
      >
        —
      </Typography>
    );
  }
  return <Typography sx={{ fontSize: 13 }}>{teacherName}</Typography>;
}

export function BalanceCell({ row }: Readonly<{ row: StudentCreditsRow }>) {
  const label = `${row.classesRemaining ?? "—"} / ${row.classesTotal ?? "—"}`;
  return <StatusBadge category="creditBalance" status={creditBalanceStatus(row.classesRemaining)} label={label} />;
}

export function AdjustAction({ studentId, label }: Readonly<{ studentId: string | null; label: string }>) {
  const router = useRouter();
  if (studentId === null) return null;
  const handleClick = () => router.push(buildAdjustHref(studentId));
  return (
    <Tooltip title={label}>
      {/* Phones get a compact icon-only chevron; from the `sm` breakpoint (tablets) up there is room for the labeled button. */}
      <Button size="small" variant="outlined" onClick={handleClick} aria-label={label} sx={adjustActionSx}>
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
          {label}
        </Box>
        <ChevronRightOutlined
          fontSize="small"
          aria-hidden
          sx={mergeSx(rtlFlipIconSx, { display: { xs: "inline-flex", sm: "none" } })}
        />
      </Button>
    </Tooltip>
  );
}
