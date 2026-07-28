"use client";

import { BookOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import type { SubjectCardProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { MobileClassAvatar } from "@/frontend/mobile/components/ui/avatar/MobileClassAvatar";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card";

/**
 * SubjectCardMobile — edge-to-edge list item for MobileCardList.
 */
export function SubjectCardMobile({
  labels,
  subject,
  onEdit,
  onDelete,
  onClick,
  canManage,
}: Readonly<SubjectCardProps>) {
  const t = labels;

  return (
    <MobileCardListItem variant="edge-to-edge" interactive>
      <Box onClick={onClick} sx={{ cursor: "pointer" }}>
        <Stack sx={{ gap: 1 }}>
          <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.5 }}>
            <MobileClassAvatar src={subject.avatarUrl ?? undefined} label={subject.name ?? ""} size={40} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
                {subject.name}
              </Typography>
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {subject.slug}
              </Typography>
            </Box>
          </Stack>

          {subject.category ? (
            <Chip
              label={subject.category.name}
              size="small"
              sx={theme => ({
                backgroundColor: theme.palette.primaryContainer,
                color: theme.palette.onPrimaryContainer,
                alignSelf: "flex-start",
              })}
            />
          ) : null}

          {subject.description ? (
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
          ) : null}

          <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 0.5 }}>
            <BookOutlined sx={theme => ({ fontSize: 16, color: theme.palette.text.secondary })} />
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {t.resourceCount(subject.resources?.length ?? 0)}
            </Typography>
          </Stack>

          {subject.isActive === false ? (
            <Chip
              label={t.inactive}
              size="small"
              sx={theme => ({
                backgroundColor: theme.palette.errorContainer,
                color: theme.palette.onErrorContainer,
                alignSelf: "flex-start",
              })}
            />
          ) : null}
        </Stack>
      </Box>

      {canManage ? (
        <Stack sx={{ flexDirection: "row", justifyContent: "flex-end", gap: 0.5, mt: 1 }}>
          <IconButton onClick={onEdit} size="small" aria-label={t.editSubject}>
            <EditOutlined fontSize="small" />
          </IconButton>
          <IconButton onClick={onDelete} size="small" aria-label={t.deleteSubject}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Stack>
      ) : null}
    </MobileCardListItem>
  );
}
