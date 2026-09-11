"use client";

import { CloseOutlined } from "@mui/icons-material";
import { Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from "@mui/material";
import { TestRecipientsPanel } from "@/frontend/common/views/dashboard/whatsapp/conversations/TestRecipientsPanel";
import { useTestRecipientsManageViewModel } from "@/frontend/common/views/dashboard/whatsapp/conversations/useTestRecipientsManageViewModel";
import { Translation, useAppTranslation } from "@/shared/locale";

const MANAGE_DIALOG_ID = "whatsapp-manage-test-recipients-dialog";

/** Dialog body: a fresh registry mount per open cycle keeps the query hot. */
function ManageDialogBody({ accountId }: Readonly<{ accountId: string }>) {
  const panelProps = useTestRecipientsManageViewModel(accountId);
  return <TestRecipientsPanel {...panelProps} />;
}

/**
 * Settings-scoped manage surface for a test number's recipient registry:
 * renders the shared recipients panel inside a dialog so admins can add,
 * verify, or remove recipients from the Numbers tab without leaving settings.
 */
export function TestRecipientsManageDialog({
  accountId,
  open,
  onClose,
  fullScreen = false,
}: Readonly<{
  readonly accountId: string;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly fullScreen?: boolean;
}>) {
  const labels = useAppTranslation(Translation.WhatsappConversations);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      aria-labelledby={MANAGE_DIALOG_ID}
    >
      <DialogTitle id={MANAGE_DIALOG_ID}>
        <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
          <div>
            {labels.manageRecipientsTitle}
            <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
              {labels.manageRecipientsHint}
            </Typography>
          </div>
          <IconButton aria-label={labels.dialogCancel} onClick={onClose} size="small" edge="end">
            <CloseOutlined />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>{open ? <ManageDialogBody accountId={accountId} /> : null}</DialogContent>
    </Dialog>
  );
}
