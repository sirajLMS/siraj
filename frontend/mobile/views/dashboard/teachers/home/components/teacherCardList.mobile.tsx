"use client";

import { CalendarTodayOutlined, MoreVertOutlined, VideoChatOutlined } from "@mui/icons-material";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import {
  AccountStatus,
  type TeacherDirectoryQuery_teacherDirectory_rows as TeacherDirectoryRow,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileActionIconLink } from "@/frontend/mobile/components/ui/button";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card";
import { MobileCardList, MobileContentInset } from "@/frontend/mobile/components/ui/container";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink";
import type { TeachersDirectoryLabels } from "@/shared/locale/types/dashboard/teachers/directory";

interface TeacherCardListProps {
  readonly rows: readonly TeacherDirectoryRow[];
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly paginationOptions: ListPaginationOptions;
  readonly labels: TeachersDirectoryLabels;
  readonly onNavigateToSchedule: (teacherId: string) => void;
  readonly onNavigateToProfile: (teacher: TeacherDirectoryRow) => void;
}

function TeacherCard({ row, t }: { readonly row: TeacherDirectoryRow; readonly t: TeachersDirectoryLabels }) {
  const profileHref = profileHrefForTeacher({ userId: row.userId, teacherId: row.id });

  return (
    <MobileCardListItem variant="edge-to-edge" dimmed={row.status === AccountStatus.Deactivated}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <MobilePersonProfileLink
            href={profileHrefForTeacher({ userId: row.userId, teacherId: row.id })}
            name={row.name ?? ""}
            avatarUrl={row.avatarUrl}
            avatarSize={48}
            typographyVariant="titleLg"
            fontWeight={600}
          />
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, lineHeight: 1.6 })}>
            {row.email}
          </Typography>
        </Box>
        <MobileStatusBadge
          category="staffAccount"
          status={row.status === AccountStatus.Activated ? "activated" : "deactivated"}
          label={row.status === AccountStatus.Activated ? t.status.active : t.status.offline}
        />
      </Box>

      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pt: 2,
          borderTop: `1px solid ${theme.palette.border.main}`,
          gap: theme.spacing(2),
        })}
      >
        <Button
          startIcon={<VideoChatOutlined />}
          disabled={row.status === AccountStatus.Deactivated}
          sx={theme => ({
            color: theme.palette.primary.main,
            fontWeight: 700,
            typography: "buttonText",
          })}
        >
          {t.actions.joinRoom}
        </Button>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", marginInlineStart: "auto" }}>
          {row.userId ? (
            <ViewAsUserButton variant="link" targetUserId={row.userId} targetUserName={row.name ?? row.email ?? ""} />
          ) : null}
          {row.id ? (
            <Tooltip title={t.actions.viewSchedule}>
              <MobileActionIconLink href={`/teachers/${row.id}/schedule/weekly`} aria-label={t.actions.viewSchedule}>
                <CalendarTodayOutlined fontSize="small" />
              </MobileActionIconLink>
            </Tooltip>
          ) : null}
          {profileHref ? (
            <Tooltip title={t.actions.options}>
              <MobileActionIconLink href={profileHref} aria-label={t.actions.options}>
                <MoreVertOutlined fontSize="small" />
              </MobileActionIconLink>
            </Tooltip>
          ) : null}
        </Box>
      </Box>
    </MobileCardListItem>
  );
}

export function TeacherCardList({
  rows,
  searchQuery,
  onSearchChange,
  paginationOptions,
  labels,
}: Readonly<TeacherCardListProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <MobileContentInset>
        <SearchBarField value={searchQuery} placeholder={labels.fields.searchTeachers} onChange={onSearchChange} />
      </MobileContentInset>

      <MobileCardList
        rows={rows}
        getKey={row => row.id ?? ""}
        paginationOptions={paginationOptions}
        layout="edge-to-edge"
        renderItem={row => <TeacherCard row={row} t={labels} />}
      />
    </Box>
  );
}

export default TeacherCardList;
