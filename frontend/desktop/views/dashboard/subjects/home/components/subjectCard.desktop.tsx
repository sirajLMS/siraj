"use client";

import { BookOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { ClassAvatar } from "@/frontend/common/components/ui/avatar/ClassAvatar";
import type { SubjectCardProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { useAppTranslation } from "@/shared/locale";

/**
 * SubjectCardDesktop — fixed-aspect desktop card suited to a multi-column grid.
 *
 * Uses `height: "100%"` so all cards in a grid row share the same height
 * regardless of description length (mobile cards inside a 1-col list don't
 * need this equalization).
 */
export function SubjectCardDesktop({ subject, onEdit, onDelete, onClick, canManage }: Readonly<SubjectCardProps>) {
  const t = useAppTranslation().dashboardTranslations.subjects;

  return (
    <Card
      sx={theme => ({
        borderRadius: theme.layout.radius.card,
        border: `1px solid ${theme.palette.outlineVariant}`,
        boxShadow: theme.palette.shadow.card,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      })}
    >
      <CardActionArea onClick={onClick} sx={{ flex: 1 }}>
        <CardContent>
          <Stack sx={{ gap: 1 }}>
            <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.5 }}>
              <ClassAvatar src={subject.avatarUrl ?? undefined} label={subject.name ?? ""} size={44} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
                  {subject.name}
                </Typography>
                <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                  {subject.slug}
                </Typography>
              </Box>
            </Stack>

            {subject.category && (
              <Chip
                label={subject.category.name}
                size="small"
                sx={theme => ({
                  backgroundColor: theme.palette.primaryContainer,
                  color: theme.palette.onPrimaryContainer,
                  alignSelf: "flex-start",
                })}
              />
            )}

            {subject.description && (
              <Typography
                variant="bodyMd"
                sx={{
                  color: theme => theme.palette.text.secondary,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {subject.description}
              </Typography>
            )}

            <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 0.5 }}>
              <BookOutlined sx={theme => ({ fontSize: 16, color: theme.palette.text.secondary })} />
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {t.resourceCount(subject.resources?.length ?? 0)}
              </Typography>
            </Stack>

            {subject.isActive === false && (
              <Chip
                label={t.inactive}
                size="small"
                sx={theme => ({
                  backgroundColor: theme.palette.errorContainer,
                  color: theme.palette.onErrorContainer,
                  alignSelf: "flex-start",
                })}
              />
            )}
          </Stack>
        </CardContent>
      </CardActionArea>

      {canManage && (
        <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 1 }}>
          <IconButton onClick={onEdit} size="small" aria-label={t.editSubject}>
            <EditOutlined fontSize="small" />
          </IconButton>
          <IconButton onClick={onDelete} size="small" aria-label={t.deleteSubject}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </CardActions>
      )}
    </Card>
  );
}
