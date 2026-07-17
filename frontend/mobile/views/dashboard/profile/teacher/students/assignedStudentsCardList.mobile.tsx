"use client";

import { Chip, Paper, Stack, Typography } from "@mui/material";
import { PersonProfileLink } from "@/frontend/common/components/ui";
import { profileHrefForParent, studentHref } from "@/frontend/common/utils/profileHref";
import type { AssignedStudentsRow } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsRowTypes";
import { useAppTranslation } from "@/shared/locale";

type AssignedStudentsCardListProps = {
  readonly rows: readonly AssignedStudentsRow[];
};

function formatStatusLabel(status: string): string {
  const normalized = status.replaceAll("_", " ").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function AssignedStudentsCardList({ rows }: Readonly<AssignedStudentsCardListProps>) {
  const t = useAppTranslation().profileTranslations.base.students;

  return (
    <Stack spacing={1.5} aria-label={t.mobileListLabel}>
      {rows.map(row => (
        <Paper key={row.id} variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
              <PersonProfileLink
                href={row.id ? studentHref(row.id) : undefined}
                avatarUrl={row.studentAvatarUrl}
                name={row.studentName}
                fallbackInitial="S"
              />
              <Chip size="small" variant="outlined" label={formatStatusLabel(row.status)} />
            </Stack>
            <PersonProfileLink
              href={profileHrefForParent({
                userId: row.parentUserId,
                parentId: row.parentId,
              })}
              avatarUrl={row.parentAvatarUrl}
              name={row.parentName}
              fallbackInitial="P"
              label={t.columns.parent}
              showAvatar
              avatarSize={24}
              fontWeight={400}
            />
            <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
              {t.columns.class}: {row.className}
            </Typography>
            <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
              {t.columns.hoursPerWeek}: {row.hoursPerWeek}
            </Typography>
            <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
              {t.columns.classes}: {row.classesRemaining} / {row.classesTotal}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
