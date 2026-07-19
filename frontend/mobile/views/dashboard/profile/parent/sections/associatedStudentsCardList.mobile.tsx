"use client";

import { Stack, Typography } from "@mui/material";
import { profileHrefForUser, studentHref } from "@/frontend/common/utils/profileHref";
import type { BaseAssociatedStudentsListProps } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentScheduleComponents.types";
import {
  MobileCardList,
  MobileCardListItem,
  MobilePersonProfileLink,
  MobileStatusBadge,
} from "@/frontend/mobile/components/ui";
import { useAppTranslation } from "@/shared/locale";

function formatStatusLabel(status: string): string {
  const normalized = status.replaceAll("_", " ").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function AssociatedStudentsCardListMobile({ rows }: Readonly<BaseAssociatedStudentsListProps>) {
  const t = useAppTranslation().profileTranslations.parent;
  const tProfile = useAppTranslation().profileTranslations.base;

  return (
    <MobileCardList
      rows={rows}
      getKey={row => row.id ?? ""}
      paginationOptions={false}
      layout="edge-to-edge"
      emptyMessage={t.students.mobileListLabel}
      renderItem={row => (
        <MobileCardListItem variant="edge-to-edge">
          <Stack spacing={1.5}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
              <MobilePersonProfileLink
                href={row.id ? studentHref(row.id) : undefined}
                avatarUrl={row.studentAvatarUrl}
                name={row.name ?? tProfile.notSet}
                fallbackInitial="S"
              />
              <MobileStatusBadge
                category="studentAccount"
                status={(row.status ?? "REGULAR").toLowerCase()}
                label={formatStatusLabel(row.status ?? "REGULAR")}
              />
            </Stack>
            <MobilePersonProfileLink
              href={row.teacherUserId ? profileHrefForUser(row.teacherUserId) : undefined}
              avatarUrl={row.teacherAvatarUrl}
              name={row.teacherName?.trim() || tProfile.notSet}
              fallbackInitial="T"
              label={t.students.columns.teacher}
            />
            <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
              {t.students.columns.hoursPerWeek}: {row.hoursPerWeek}
            </Typography>
          </Stack>
        </MobileCardListItem>
      )}
    />
  );
}
