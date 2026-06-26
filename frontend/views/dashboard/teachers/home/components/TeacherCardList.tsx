import { CalendarTodayOutlined, MoreVertOutlined, SearchOutlined, VideoChatOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import type { TeacherDirectoryRow } from "@/frontend/graphql/generated/gql/graphql-types";

interface TeacherCardListProps {
  readonly rows: readonly TeacherDirectoryRow[];
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
}

export function TeacherCardList({ rows, searchQuery, onSearchChange }: Readonly<TeacherCardListProps>) {
  const t = useTranslations("dashboard.teachersDirectory");
  const router = useRouter();
  const locale = useLocale();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder={t("table.linkPending").replace("Link Pending", "Search teachers...")}
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

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {rows.map(row => (
          <Box
            key={row.id}
            sx={theme => ({
              backgroundColor: theme.palette.background.paper,
              borderRadius: "xl",
              p: 2,
              boxShadow: theme.palette.shadow.card,
              border: `1px solid ${theme.palette.border.main}`,
              opacity: row.status === "offline" ? 0.75 : 1,
            })}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Avatar
                src={row.avatarUrl || undefined}
                alt={row.name || ""}
                sx={theme => ({
                  width: 48,
                  height: 48,
                  filter: row.status === "offline" ? "grayscale(1)" : "none",
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
                status={row.status === "active" ? "regular" : "deactivated"}
                label={row.status === "active" ? t("status.active") : t("status.offline")}
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
                disabled={row.status === "offline"}
                sx={theme => ({
                  color: theme.palette.primary.main,
                  fontWeight: 700,
                  typography: "buttonText",
                })}
              >
                {t("actions.joinRoom")}
              </Button>
              <Box sx={{ display: "flex", gap: 1 }}>
                <IconButton
                  sx={theme => ({ border: `1px solid ${theme.palette.border.main}` })}
                  onClick={() => {
                    if (row.id) {
                      router.push(`/${locale}/teachers/${row.id}/schedule/weekly`);
                    }
                  }}
                >
                  <CalendarTodayOutlined sx={{ fontSize: 20 }} />
                </IconButton>
                <IconButton
                  sx={theme => ({ border: `1px solid ${theme.palette.border.main}` })}
                  onClick={() => {
                    if (row.id) {
                      router.push(`/${locale}/teachers/${row.id}/profile`);
                    }
                  }}
                >
                  <MoreVertOutlined sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
