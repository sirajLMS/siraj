"use client";

import { StickyNote2Outlined } from "@mui/icons-material";
import { alpha, Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/common/components/ui";
import type { AdminNoteInfo } from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface AdminNoteCardMobileProps {
  readonly note: AdminNoteInfo | null | undefined;
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

const StyledMobileEditButton = styled(Button)(({ theme }) => ({
  color: theme.palette.onSidebar,
  borderColor: theme.palette.outlineVariant,
  typography: "labelUppercase",
  "&:hover": {
    backgroundColor: alpha(theme.palette.onSidebar, 0.1),
    borderColor: theme.palette.onSidebar,
  },
}));

const StyledMobileUpdateButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.header,
  color: theme.palette.onPrimary,
  typography: "labelUppercase",
  boxShadow: theme.palette.shadow.button,
}));

function NoteHeaderMobile({ titleMobile }: Readonly<{ titleMobile: string }>) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
      <StickyNote2Outlined sx={{ fontSize: 20 }} />
      <Typography variant="labelUppercase">{titleMobile}</Typography>
    </Box>
  );
}

function NoteFooterMobile({
  updateLabel,
  editLabel,
  onUpdate,
  onEdit,
}: Readonly<{
  updateLabel: string;
  editLabel: string;
  onUpdate: () => void;
  onEdit: () => void;
}>) {
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

export function AdminNoteCardMobile({ note, labels, onUpdate, onEdit }: Readonly<AdminNoteCardMobileProps>) {
  const content = note?.content ?? "";

  return (
    <BaseCard
      sx={theme => ({
        backgroundColor: theme.palette.sidebar,
        color: theme.palette.onSidebar,
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <NoteHeaderMobile titleMobile={labels.titleMobile} />

      <Typography variant="bodyMd" sx={{ opacity: 0.85, lineHeight: 1.6, mb: 2 }}>
        {content}
      </Typography>

      <NoteFooterMobile updateLabel={labels.update} editLabel={labels.edit} onUpdate={onUpdate} onEdit={onEdit} />
    </BaseCard>
  );
}
