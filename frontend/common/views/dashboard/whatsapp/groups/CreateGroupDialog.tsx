"use client";

import { CloseOutlined } from "@mui/icons-material";
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { WhatsappGroupJoinApprovalMode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappGroupsCreateLabels } from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";

const CREATE_DIALOG_ID = "whatsapp-create-group-dialog";

function isApprovalMode(value: unknown): value is WhatsappGroupJoinApprovalMode {
  return (
    value === WhatsappGroupJoinApprovalMode.ApprovalRequired || value === WhatsappGroupJoinApprovalMode.AutoApprove
  );
}

export interface CreateGroupDialogProps {
  readonly labels: WhatsappGroupsCreateLabels;
  readonly cancelLabel: string;
  readonly open: boolean;
  readonly subject: string;
  readonly onSubjectChange: (value: string) => void;
  readonly description: string;
  readonly onDescriptionChange: (value: string) => void;
  readonly approvalMode: WhatsappGroupJoinApprovalMode;
  readonly onApprovalModeChange: (mode: WhatsappGroupJoinApprovalMode) => void;
  readonly submitDisabled: boolean;
  readonly creating: boolean;
  readonly error: string | null;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
}

/**
 * Create-group dialog for the `/whatsapp` groups workspace: subject,
 * optional description, and the join-approval mode radio. Submit is gated on
 * a non-empty subject; Meta enforces the 128-character limit server-side.
 */
export function CreateGroupDialog({
  labels,
  cancelLabel,
  open,
  subject,
  onSubjectChange,
  description,
  onDescriptionChange,
  approvalMode,
  onApprovalModeChange,
  submitDisabled,
  creating,
  error,
  onSubmit,
  onClose,
}: Readonly<CreateGroupDialogProps>) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby={CREATE_DIALOG_ID}>
      <DialogTitle id={CREATE_DIALOG_ID}>
        <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
          <div>
            {labels.createGroupTitle}
            <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
              {labels.createGroupDescription}
            </Typography>
          </div>
          <IconButton aria-label={cancelLabel} onClick={onClose} size="small" edge="end">
            <CloseOutlined />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            size="small"
            label={labels.subjectLabel}
            placeholder={labels.subjectPlaceholder}
            value={subject}
            onChange={event => onSubjectChange(event.target.value)}
            required
            fullWidth
          />
          <TextField
            size="small"
            label={labels.descriptionLabel}
            placeholder={labels.descriptionPlaceholder}
            value={description}
            onChange={event => onDescriptionChange(event.target.value)}
            multiline
            minRows={2}
            maxRows={5}
            fullWidth
          />
          <FormControl>
            <RadioGroup
              value={approvalMode}
              onChange={(_event, next: string) => {
                const modes: Record<string, WhatsappGroupJoinApprovalMode> = {
                  [WhatsappGroupJoinApprovalMode.ApprovalRequired]: WhatsappGroupJoinApprovalMode.ApprovalRequired,
                  [WhatsappGroupJoinApprovalMode.AutoApprove]: WhatsappGroupJoinApprovalMode.AutoApprove,
                };
                const mode = modes[next];
                if (isApprovalMode(mode)) {
                  onApprovalModeChange(mode);
                }
              }}
            >
              <FormControlLabel
                value={WhatsappGroupJoinApprovalMode.AutoApprove}
                control={<Radio size="small" />}
                label={labels.approvalModeAuto}
              />
              <FormControlLabel
                value={WhatsappGroupJoinApprovalMode.ApprovalRequired}
                control={<Radio size="small" />}
                label={labels.approvalModeRequired}
              />
            </RadioGroup>
          </FormControl>
          {error !== null && (
            <Alert severity="error" component="div">
              <Typography variant="bodyMd">{error}</Typography>
            </Alert>
          )}
          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
            <Button color="inherit" onClick={onClose} disabled={creating}>
              {cancelLabel}
            </Button>
            <Button variant="contained" onClick={onSubmit} disabled={creating || submitDisabled}>
              {labels.createGroup}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
