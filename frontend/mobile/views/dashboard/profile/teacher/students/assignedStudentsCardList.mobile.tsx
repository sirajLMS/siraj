"use client";

import { Chip, Stack, Typography } from "@mui/material";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { profileHrefForParent, studentHref } from "@/frontend/common/utils/profileHref";
import type { AssignedStudentsRow } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsRowTypes";
import { formatStatusLabel } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsStatusFormatters";
import type { AssignedStudentsListLabels } from "@/frontend/common/views/dashboard/profile/teacher/students/types/assignedStudentsList.types";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card";
import { MobileCardList } from "@/frontend/mobile/components/ui/container/MobileCardList";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink";

type AssignedStudentsCardListProps = {
  readonly rows: readonly AssignedStudentsRow[];
  readonly labels: AssignedStudentsListLabels;
  readonly paginationOptions: ListPaginationOptions;
};

export function AssignedStudentsCardList({ rows, labels, paginationOptions }: Readonly<AssignedStudentsCardListProps>) {
  const { columns } = labels;

  return (
    <MobileCardList
      rows={rows}
      getKey={row => row.id}
      paginationOptions={paginationOptions}
      layout="edge-to-edge"
      emptyMessage={labels.emptyMessage}
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
              label={columns.parent}
              showAvatar
              avatarSize={24}
              fontWeight={400}
            />
            <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
              {columns.class}: {row.className}
            </Typography>
            <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
              {columns.hoursPerWeek}: {row.hoursPerWeek}
            </Typography>
            <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
              {columns.classes}: {row.classesRemaining} / {row.classesTotal}
            </Typography>
          </Stack>
        </MobileCardListItem>
      )}
    />
  );
}
