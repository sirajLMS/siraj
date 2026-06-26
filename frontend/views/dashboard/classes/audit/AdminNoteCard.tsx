"use client";

import { AdminPanelSettingsOutlined, StickyNote2Outlined } from "@mui/icons-material";
import { alpha, Box, Button, Typography, useMediaQuery, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/components/ui";
import type { AdminNote } from "@/frontend/stores/mockClassAuditStore";

interface AdminNoteCardProps {
  readonly note: AdminNote;
  readonly labels: {
    readonly title: string;
    readonly titleMobile: string;
    readonly lastUpdated: string;
    readonly update: string;
    readonly edit: string;
  };
  readonly onUpdate: () => void;
  readonly onEdit: () => void;
}

interface NoteHeaderProps {
  readonly isMobile: boolean;
  readonly title: string;
  readonly titleMobile: string;
}

interface NoteFooterMobileProps {
  readonly updateLabel: string;
  readonly editLabel: string;
  readonly onUpdate: () => void;
  readonly onEdit: () => void;
}

interface NoteFooterDesktopProps {
  readonly lastUpdatedText: string;
  readonly updateLabel: string;
  readonly onUpdate: () => void;
}

// Outlined mobile edit button with onSidebar tint and outlineVariant border
const StyledMobileEditButton = styled(Button)(({ theme }) => ({
  color: theme.palette.onSidebar,
  borderColor: theme.palette.outlineVariant,
  typography: "labelUppercase",
  "&:hover": {
    backgroundColor: alpha(theme.palette.onSidebar, 0.1),
    borderColor: theme.palette.onSidebar,
  },
}));

// Contained mobile update button using header background and onPrimary text
const StyledMobileUpdateButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.header,
  color: theme.palette.onPrimary,
  typography: "labelUppercase",
  boxShadow: theme.palette.shadow.button,
}));

// Desktop footer strip with outlineVariant top border separating the note body from actions
const StyledDesktopFooter = styled(Box)(({ theme }) => ({
  pt: 2,
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

function NoteHeader({ isMobile, title, titleMobile }: NoteHeaderProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: isMobile ? 2 : 1.5 }}>
      {isMobile ? <StickyNote2Outlined sx={{ fontSize: 20 }} /> : <AdminPanelSettingsOutlined />}
      <Typography variant={isMobile ? "labelUppercase" : "titleLg"}>{isMobile ? titleMobile : title}</Typography>
    </Box>
  );
}

function NoteFooterMobile({ updateLabel, editLabel, onUpdate, onEdit }: NoteFooterMobileProps) {
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
      <StyledMobileEditButton id="admin-note-edit-mobile" variant="outlined" onClick={onEdit}>
        {editLabel}
      </StyledMobileEditButton>
      <StyledMobileUpdateButton id="admin-note-update-mobile" variant="contained" onClick={onUpdate}>
        {updateLabel}
      </StyledMobileUpdateButton>
    </Box>
  );
}

function NoteFooterDesktop({ lastUpdatedText, updateLabel, onUpdate }: NoteFooterDesktopProps) {
  return (
    <StyledDesktopFooter>
      <Typography variant="labelUppercase" sx={{ opacity: 0.6 }}>
        {lastUpdatedText}
      </Typography>
      <Typography
        component="button"
        variant="labelUppercase"
        onClick={onUpdate}
        sx={theme => ({
          color: theme.palette.primary.main,
          background: "none",
          border: "none",
          cursor: "pointer",
          p: 0,
          "&:hover": { textDecoration: "underline" },
        })}
      >
        {updateLabel}
      </Typography>
    </StyledDesktopFooter>
  );
}

export function AdminNoteCard({ note, labels, onUpdate, onEdit }: AdminNoteCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const lastUpdatedText = labels.lastUpdated.replace("{time}", note.lastUpdated);

  return (
    <BaseCard
      sx={theme => ({
        backgroundColor: theme.palette.sidebar,
        color: theme.palette.onSidebar,
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <NoteHeader isMobile={isMobile} title={labels.title} titleMobile={labels.titleMobile} />

      <Typography variant="bodyMd" sx={{ opacity: 0.85, lineHeight: 1.6, mb: 2 }}>
        {note.content}
      </Typography>

      {isMobile ? (
        <NoteFooterMobile updateLabel={labels.update} editLabel={labels.edit} onUpdate={onUpdate} onEdit={onEdit} />
      ) : (
        <NoteFooterDesktop lastUpdatedText={lastUpdatedText} updateLabel={labels.update} onUpdate={onUpdate} />
      )}
    </BaseCard>
  );
}
