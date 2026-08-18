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

type StudentStatusKey = "regular" | "suspended" | "on_leave" | "on_trial" | "deactivated";

function isStudentStatusKey(value: string): value is StudentStatusKey {
  return (
    value === "regular" ||
    value === "suspended" ||
    value === "on_leave" ||
    value === "on_trial" ||
    value === "deactivated"
  );
}

function studentStatusLabel(
  status: string,
  labels: { regular: string; suspended: string; on_leave: string; on_trial: string; deactivated: string }
): string {
  const key = status.toLowerCase();
  return isStudentStatusKey(key) ? labels[key] : labels.regular;
}

export function AssociatedStudentsCardListMobile({ rows, labels }: Readonly<BaseAssociatedStudentsListProps>) {
  const { parent: t, base: tProfile } = labels;

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
                label={studentStatusLabel(row.status ?? "REGULAR", t.students.statusLabel)}
              />
            </Stack>
            <MobilePersonProfileLink
              href={row.teacherUserId ? profileHrefForUser(row.teacherUserId) : undefined}
              avatarUrl={row.teacherAvatarUrl}
              name={row.teacherName?.trim() ?? tProfile.notSet}
              fallbackInitial="T"
              label={t.students.columns.teacher}
            />
            <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
              {t.students.columns.hoursPerWeek}: {row.hoursPerWeek}
            </Typography>
          </Stack>
        </MobileCardListItem>
      )}
    />
  );
}
