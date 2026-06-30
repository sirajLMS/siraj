import { CalendarTodayOutlined, MoreVertOutlined, SearchOutlined, VideoChatOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { PaginationControls } from "@/frontend/components/ui";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import type { TeacherDirectoryRow } from "@/frontend/graphql/generated/gql/graphql-types";
import { AccountStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { useRouter } from "@/shared/i18n/routing";

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
  readonly t: ReturnType<typeof useTranslations<"dashboard.teachersDirectory">>;
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
        <Avatar
          src={row.avatarUrl || undefined}
          alt={row.name || ""}
          sx={theme => ({
            width: 48,
            height: 48,
            filter: row.status === AccountStatus.Deactivated ? "grayscale(1)" : "none",
            border: `1px solid ${theme.palette.border.main}`,
          })}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
            {row.name}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {row.email}
          </Typography>
        </Box>
        <StatusBadge
          category="studentAccount"
          status={row.status === AccountStatus.Activated ? "regular" : "deactivated"}
          label={row.status === AccountStatus.Activated ? t("status.active") : t("status.offline")}
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
          {t("actions.joinRoom")}
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
  readonly t: ReturnType<typeof useTranslations<"dashboard.teachersDirectory">>;
  readonly router: ReturnType<typeof useRouter>;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1 }}>
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
          if (row.id) {
            router.push(`/teachers/${row.id}/profile`);
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
  const t = useTranslations("dashboard.teachersDirectory");
  const router = useRouter();

  const pageCount = totalCount !== undefined && pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <TeacherSearchField
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        placeholder={t("table.linkPending").replace("Link Pending", "Search teachers...")}
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
