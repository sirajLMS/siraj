"use client";

import { Avatar, Paper, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { StatusBadge } from "@/frontend/components/ui";
import { Link } from "@/shared/i18n/routing";
import type { AssociatedStudentRow } from "./parentProfileTypes";

type AssociatedStudentsCardListProps = {
  readonly rows: readonly AssociatedStudentRow[];
};

function formatStatusLabel(status: string): string {
  const normalized = status.replaceAll("_", " ").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getInitial(name: string | null | undefined, fallback: string): string {
  return (name?.trim()?.[0] ?? fallback).toUpperCase();
}

function LinkedPersonRow({
  href,
  avatarUrl,
  name,
  fallbackInitial,
  label,
}: {
  readonly href?: string;
  readonly avatarUrl?: string | null;
  readonly name: string;
  readonly fallbackInitial: string;
  readonly label?: string;
}) {
  const content = (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
      <Avatar src={avatarUrl ?? undefined} sx={{ width: 28, height: 28 }}>
        {getInitial(name, fallbackInitial)}
      </Avatar>
      <Stack spacing={0.25}>
        {label ? (
          <Typography sx={{ typography: "labelSm", color: theme => theme.palette.text.secondary }}>{label}</Typography>
        ) : null}
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.primary.main, fontWeight: 600 }}>
          {name}
        </Typography>
      </Stack>
    </Stack>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      {content}
    </Link>
  );
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
              <LinkedPersonRow
                href={row.id ? `/students/${row.id}` : undefined}
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
            <LinkedPersonRow
              href={row.teacherUserId ? `/users/${row.teacherUserId}/profile` : undefined}
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
