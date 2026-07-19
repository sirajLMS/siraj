"use client";

import { Chip, Stack, Typography } from "@mui/material";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { profileHrefForParent, studentHref } from "@/frontend/common/utils/profileHref";
import type { AssignedStudentsRow } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsRowTypes";
import { formatStatusLabel } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsStatusFormatters";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card";
import { MobileCardList } from "@/frontend/mobile/components/ui/container/MobileCardList";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink";
import { useAppTranslation } from "@/shared/locale";

type AssignedStudentsCardListProps = {
  readonly rows: readonly AssignedStudentsRow[];
  readonly paginationOptions: ListPaginationOptions;
};

export function AssignedStudentsCardList({ rows, paginationOptions }: Readonly<AssignedStudentsCardListProps>) {
  const t = useAppTranslation().profileTranslations.base.students;

  return (
    <MobileCardList
      rows={rows}
      getKey={row => row.id}
      paginationOptions={paginationOptions}
      layout="edge-to-edge"
      emptyMessage={t.mobileListLabel}
      renderItem={row => (
        <MobileCardListItem variant="edge-to-edge">
          <Stack spacing={1}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
              <MobilePersonProfileLink
                href={row.id ? studentHref(row.id) : undefined}
                avatarUrl={row.studentAvatarUrl}
                name={row.studentName}
                fallbackInitial="S"
              />
              <Chip size="small" variant="outlined" label={formatStatusLabel(row.status)} />
            </Stack>
            <MobilePersonProfileLink
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
        </MobileCardListItem>
      )}
    />
  );
}
