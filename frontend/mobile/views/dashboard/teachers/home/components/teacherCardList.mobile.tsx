import { CalendarTodayOutlined, MoreVertOutlined, SearchOutlined, VideoChatOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { TeacherDirectoryRow } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink";
import { MobileListPagination } from "@/frontend/mobile/components/ui/filter";
import type { TeachersDirectoryLabels } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale";

interface TeacherCardListProps {
  readonly rows: readonly TeacherDirectoryRow[];
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly paginationOptions: ListPaginationOptions;
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
                mr: 1,
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
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: 0,
        p: 2,
        boxShadow: theme.palette.shadow.card,
        border: `1px solid ${theme.palette.border.main}`,
        opacity: row.status === AccountStatus.Deactivated ? 0.75 : 1,
      })}
    >
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
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
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
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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
    </Box>
  );
}

export function TeacherCardList({
  rows,
  searchQuery,
  onSearchChange,
  paginationOptions,
  onNavigateToSchedule,
  onNavigateToProfile,
}: Readonly<TeacherCardListProps>) {
  const t = useAppTranslation().dashboardTranslations.teachersDirectory;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <TeacherSearchField
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        placeholder="placeholders.searchTeachers"
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {rows.map(row => (
          <TeacherCard
            key={row.id}
            row={row}
            t={t}
            onNavigateToSchedule={onNavigateToSchedule}
            onNavigateToProfile={onNavigateToProfile}
          />
        ))}
      </Box>

      <MobileListPagination paginationOptions={paginationOptions} />
    </Box>
  );
}

export default TeacherCardList;
