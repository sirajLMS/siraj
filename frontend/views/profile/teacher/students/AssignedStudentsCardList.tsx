"use client";

import { Avatar, Chip, Paper, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { AssignedStudentsRow } from "./AssignedStudentsDataGrid";

type AssignedStudentsCardListProps = {
  readonly rows: readonly AssignedStudentsRow[];
};

function formatStatusLabel(status: string): string {
  const normalized = status.replaceAll("_", " ").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function AssignedStudentsCardList({ rows }: AssignedStudentsCardListProps) {
  const t = useTranslations("profile.students");

  return (
    <Stack spacing={1.5} aria-label={t("mobileListLabel")}>
      {rows.map(row => (
        <Paper key={row.id} variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                <Avatar src={row.studentAvatarUrl ?? undefined} sx={{ width: 28, height: 28 }}>
                  {(row.studentName[0] ?? "S").toUpperCase()}
                </Avatar>
                <Typography sx={{ typography: "titleMd" }}>{row.studentName}</Typography>
              </Stack>
              <Chip size="small" variant="outlined" label={formatStatusLabel(row.status)} />
            </Stack>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <Avatar src={row.parentAvatarUrl ?? undefined} sx={{ width: 24, height: 24 }}>
                {(row.parentName[0] ?? "P").toUpperCase()}
              </Avatar>
              <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
                {t("columns.parent")}: {row.parentName}
              </Typography>
            </Stack>
            <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
              {t("columns.class")}: {row.className}
            </Typography>
            <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
              {t("columns.hoursPerWeek")}: {row.hoursPerWeek}
            </Typography>
            <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
              {t("columns.classes")}: {row.classesRemaining} / {row.classesTotal}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
