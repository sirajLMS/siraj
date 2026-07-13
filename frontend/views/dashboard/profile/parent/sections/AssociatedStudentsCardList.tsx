"use client";

import { Paper, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { PersonProfileLink, StatusBadge } from "@/frontend/components/ui";
import { profileHrefForUser, studentHref } from "@/frontend/common/utils/profileHref";
import type { AssociatedStudentRow } from "@/frontend/views/dashboard/profile/parent/sections/parentProfileTypes";

type AssociatedStudentsCardListProps = {
  readonly rows: readonly AssociatedStudentRow[];
};

function formatStatusLabel(status: string): string {
  const normalized = status.replaceAll("_", " ").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function AssociatedStudentsCardList({ rows }: AssociatedStudentsCardListProps) {
  const t = useTranslations("profile.parent");
  const tc = useTranslations("profile");

  return (
    <Stack spacing={1.5} aria-label={t("students.mobileListLabel")}>
      {rows.map(row => (
        <Paper key={row.id} variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
              <PersonProfileLink
                href={row.id ? studentHref(row.id) : undefined}
                avatarUrl={row.studentAvatarUrl}
                name={row.name ?? tc("notSet")}
                fallbackInitial="S"
              />
              <StatusBadge
                category="studentAccount"
                status={(row.status ?? "REGULAR").toLowerCase()}
                label={formatStatusLabel(row.status ?? "REGULAR")}
              />
            </Stack>
            <PersonProfileLink
              href={row.teacherUserId ? profileHrefForUser(row.teacherUserId) : undefined}
              avatarUrl={row.teacherAvatarUrl}
              name={row.teacherName?.trim() || tc("notSet")}
              fallbackInitial="T"
              label={t("students.columns.teacher")}
            />
            <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
              {t("students.columns.hoursPerWeek")}: {row.hoursPerWeek}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
