"use client";

import { AdminPanelSettingsOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/common/components/ui";
import type { AdminNoteCardDesktopProps } from "@/frontend/common/views/dashboard/classes/audit/adminNoteCard.types";

const StyledDesktopFooter = styled(Box)(({ theme }) => ({
  pt: 2,
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

const UpdateButton = styled("button")(({ theme }) => ({
  color: theme.palette.primary.main,
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
  font: "inherit",
  "&:hover": { textDecoration: "underline" },
}));

function NoteHeaderDesktop({ title }: Readonly<{ title: string }>) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
      <AdminPanelSettingsOutlined />
      <Typography variant="titleLg">{title}</Typography>
    </Box>
  );
}

function NoteFooterDesktop({
  lastUpdatedText,
  updateLabel,
  onUpdate,
}: Readonly<{ lastUpdatedText: string; updateLabel: string; onUpdate: () => void }>) {
  return (
    <StyledDesktopFooter>
      <Typography variant="labelUppercase" sx={{ opacity: 0.6 }}>
        {lastUpdatedText}
      </Typography>
      <UpdateButton type="button" onClick={onUpdate}>
        <Typography variant="labelUppercase" sx={{ color: "inherit" }}>
          {updateLabel}
        </Typography>
      </UpdateButton>
    </StyledDesktopFooter>
  );
}

export function AdminNoteCardDesktop({ note, labels, onUpdate }: Readonly<AdminNoteCardDesktopProps>) {
  const lastUpdatedText = labels.lastUpdated.replace("{time}", note?.lastUpdated ?? "");
  const content = note?.content ?? "";

  return (
    <BaseCard
      sx={theme => ({
        backgroundColor: theme.palette.sidebar,
        color: theme.palette.onSidebar,
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <NoteHeaderDesktop title={labels.title} />

      <Typography variant="bodyMd" sx={{ opacity: 0.85, lineHeight: 1.6, mb: 2 }}>
        {content}
      </Typography>

      <NoteFooterDesktop lastUpdatedText={lastUpdatedText} updateLabel={labels.update} onUpdate={onUpdate} />
    </BaseCard>
  );
}
