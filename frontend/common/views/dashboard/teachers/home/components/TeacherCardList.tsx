import { CalendarTodayOutlined, MoreVertOutlined, SearchOutlined, VideoChatOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import { PaginationControls, PersonProfileLink } from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import type { TeacherDirectoryRow } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale/client";
import type { TeachersDirectoryLabels } from "@/shared/locale/types/dashboard/teachers/directory";

interface TeacherCardListProps {
  readonly rows: readonly TeacherDirectoryRow[];
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
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
            borderRadius: "xl",
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
  router,
}: {
  readonly row: TeacherDirectoryRow;
  readonly t: TeachersDirectoryLabels;
  readonly router: ReturnType<typeof useRouter>;
}) {
  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        p: 2,
        boxShadow: theme.palette.shadow.card,
        border: `1px solid ${theme.palette.border.main}`,
        opacity: row.status === AccountStatus.Deactivated ? 0.75 : 1,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <PersonProfileLink
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
        <StatusBadge
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
        <TeacherCardActions row={row} t={t} router={router} />
      </Box>
    </Box>
  );
}

function TeacherCardActions({
  row,
  t: _t,
  router,
}: {
  readonly row: TeacherDirectoryRow;
  readonly t: TeachersDirectoryLabels;
  readonly router: ReturnType<typeof useRouter>;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
      {row.userId ? (
        <ViewAsUserButton variant="link" targetUserId={row.userId} targetUserName={row.name ?? row.email ?? ""} />
      ) : null}
      <IconButton
        sx={theme => ({ border: `1px solid ${theme.palette.border.main}` })}
        onClick={() => {
          if (row.id) {
            router.push(`/teachers/${row.id}/schedule/weekly`);
          }
        }}
      >
        <CalendarTodayOutlined sx={{ fontSize: 20 }} />
      </IconButton>
      <IconButton
        sx={theme => ({ border: `1px solid ${theme.palette.border.main}` })}
        onClick={() => {
          const href = profileHrefForTeacher({ userId: row.userId, teacherId: row.id });
          if (href) {
            router.push(href);
          }
        }}
      >
        <MoreVertOutlined sx={{ fontSize: 20 }} />
      </IconButton>
    </Box>
  );
}

export function TeacherCardList({
  rows,
  searchQuery,
  onSearchChange,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<TeacherCardListProps>) {
  const t = useAppTranslation("dashboard.teachersDirectory");
  const router = useRouter();

  const pageCount = totalCount !== undefined && pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <TeacherSearchField
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        placeholder="placeholders.searchTeachers"
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {rows.map(row => (
          <TeacherCard key={row.id} row={row} t={t} router={router} />
        ))}
      </Box>

      {onPageChange && totalCount !== undefined ? (
        <PaginationControls
          page={page}
          pageCount={pageCount}
          rowCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      ) : null}
    </Box>
  );
}
