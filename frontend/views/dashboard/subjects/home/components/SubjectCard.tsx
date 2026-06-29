"use client";

import { BookOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Card, CardActionArea, CardActions, CardContent, Chip, IconButton, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { SubjectCardProps } from "../types";

export function SubjectCard({ subject, onEdit, onDelete, onClick, canManage }: Readonly<SubjectCardProps>) {
  const t = useTranslations("dashboard.subjects");

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
            <Typography variant="titleLg" sx={{ color: theme => theme.palette.onSurface }}>
              {subject.name}
            </Typography>

            <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
              {subject.slug}
            </Typography>

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
              <Typography variant="labelMd" sx={{ color: theme => theme.palette.text.secondary }}>
                {t("resourceCount", { count: subject.resources?.length ?? 0 })}
              </Typography>
            </Stack>

            {subject.isActive === false && (
              <Chip
                label={t("inactive")}
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
          <IconButton onClick={onEdit} size="small" aria-label={t("editSubject")}>
            <EditOutlined fontSize="small" />
          </IconButton>
          <IconButton onClick={onDelete} size="small" aria-label={t("deleteSubject")}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </CardActions>
      )}
    </Card>
  );
}
