import { CalendarTodayOutlined, MoreVertOutlined, SearchOutlined, VideoChatOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { TeacherDirectoryRow } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card";
import { MobileCardList } from "@/frontend/mobile/components/ui/container/MobileCardList";
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

function TeacherSearchField({
  searchQuery,
  onSearchChange,
  placeholder,
}: {
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly placeholder: string;
}) {
  return (
    <TextField
      fullWidth
      placeholder={placeholder}
      value={searchQuery}
      onChange={e => {
        onSearchChange(e.target.value);
      }}
      slotProps={{
        input: {
          startAdornment: (
            <SearchOutlined
              sx={theme => ({
                color: theme.palette.text.disabled,
                marginInlineEnd: theme.spacing(1),
              })}
            />
          ),
          sx: theme => ({
            borderRadius: 0,
            backgroundColor: theme.palette.background.paper,
          }),
        },
      }}
    />
  );
}

function TeacherCard({
  row,
  t,
  onNavigateToSchedule,
  onNavigateToProfile,
}: {
  readonly row: TeacherDirectoryRow;
  readonly t: TeachersDirectoryLabels;
  readonly onNavigateToSchedule: (teacherId: string) => void;
  readonly onNavigateToProfile: (teacher: TeacherDirectoryRow) => void;
}) {
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
          category="studentAccount"
          status={row.status === AccountStatus.Activated ? "regular" : "deactivated"}
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
          <IconButton
            sx={theme => ({ border: `1px solid ${theme.palette.border.main}` })}
            onClick={() => {
              if (row.id) {
                onNavigateToSchedule(row.id);
              }
            }}
          >
            <CalendarTodayOutlined sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton
            sx={theme => ({ border: `1px solid ${theme.palette.border.main}` })}
            onClick={() => onNavigateToProfile(row)}
          >
            <MoreVertOutlined sx={{ fontSize: 20 }} />
          </IconButton>
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
  onNavigateToSchedule,
  onNavigateToProfile,
}: Readonly<TeacherCardListProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <TeacherSearchField
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        placeholder="placeholders.searchTeachers"
      />

      <MobileCardList
        rows={rows}
        getKey={row => row.id ?? ""}
        paginationOptions={paginationOptions}
        layout="edge-to-edge"
        renderItem={row => (
          <TeacherCard
            row={row}
            t={labels}
            onNavigateToSchedule={onNavigateToSchedule}
            onNavigateToProfile={onNavigateToProfile}
          />
        )}
      />
    </Box>
  );
}

export default TeacherCardList;
