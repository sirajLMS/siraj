"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { BaseCard } from "@/frontend/components/ui/BaseCard";

export function ImportantNotes() {
  const t = useTranslations("dashboard.teacherFutureSchedule");

  const notes = [
    { title: "Quarterly Review", subtitle: "Oct 26 • All day event" },
    { title: "Final Exam Submission", subtitle: "Due in 4 days" },
  ];

  return (
    <BaseCard
      sx={theme => ({
        p: 3,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        border: 1,
        borderColor: theme.palette.border.main,
        boxShadow: theme.palette.shadow.card,
        position: "relative",
        overflow: "hidden",
      })}
    >
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={theme => ({
            alignItems: "center",
            mb: 2,
            color: theme.palette.primary.main,
          })}
        >
          <InfoOutlined fontSize="small" sx={theme => ({ color: theme.palette.primary.main })} />
          <Typography variant="titleLg" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
            {t("importantNotes")}
          </Typography>
        </Stack>

        <Stack spacing={1.5}>
          {notes.map(note => (
            <Box
              key={note.title}
              sx={theme => ({
                p: 2,
                backgroundColor: theme.palette.surfaceContainerLow,
                borderRadius: 2,
                border: 1,
                borderStyle: "solid",
                borderColor: theme.palette.border.main,
              })}
            >
              <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.text.primary })}>
                {note.title}
              </Typography>
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {note.subtitle}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Decorative Circle */}
      <Box
        sx={theme => ({
          position: "absolute",
          right: -40,
          bottom: -40,
          width: 160,
          height: 160,
          backgroundColor: theme.palette.primary.main,
          opacity: 0.05,
          borderRadius: "50%",
        })}
      />
    </BaseCard>
  );
}
