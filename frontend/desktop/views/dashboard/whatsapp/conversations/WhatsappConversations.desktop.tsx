"use client";

import { AddOutlined, LockOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material";
import {
  WhatsappConversationsBanner,
  WhatsappConversationsListBlock,
  WhatsappConversationsRecipientsBlock,
  WhatsappConversationsWorkspacePane,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/ConversationsWorkspaceShared";
import { NoWhatsappAccountsState } from "@/frontend/common/views/dashboard/whatsapp/conversations/NoWhatsappAccountsState";
import type { WhatsappConversationsViewModel } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

function ReadOnlyChip({ label }: Readonly<{ label: string }>) {
  return <Chip size="small" variant="outlined" icon={<LockOutlined />} label={label} />;
}

function NewConversationAction({
  label,
  disabled,
  onStart,
}: Readonly<{ label: string; disabled: boolean; onStart: () => void }>) {
  return (
    <Button size="small" variant="outlined" startIcon={<AddOutlined />} onClick={onStart} disabled={disabled}>
      {label}
    </Button>
  );
}

/**
 * Desktop layout for the `/whatsapp` conversations workspace: list (with the
 * account selector and search) beside the thread/composer pane, plus a third
 * column with the test-recipient registry while a test number is selected.
 */
export function WhatsappConversationsDesktopView(vm: Readonly<WhatsappConversationsViewModel>) {
  const { shell, list } = vm.labelsBySection;
  const noAccounts = !vm.accountsLoading && vm.accounts.length === 0;
  const showRecipients = vm.isTestAccount;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={shell.title}
        subtitle={shell.subtitle}
        actions={
          vm.canManage ? (
            <NewConversationAction
              label={shell.newConversation}
              disabled={vm.accounts.length === 0}
              onStart={vm.onStartNewConversation}
            />
          ) : (
            <ReadOnlyChip label={shell.readOnlyBadge} />
          )
        }
      />
      {noAccounts ? (
        <NoWhatsappAccountsState labels={shell} />
      ) : (
        <Stack spacing={2}>
          <WhatsappConversationsBanner vm={vm} />
          {vm.conversationsError && (
            <Alert
              severity="error"
              component="div"
              action={
                <Button color="inherit" size="small" onClick={vm.onRetryConversations}>
                  {list.retry}
                </Button>
              }
            >
              <Typography variant="bodyMd">{list.loadErrorDescription}</Typography>
            </Alert>
          )}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              alignItems: "start",
              gridTemplateColumns: showRecipients
                ? "minmax(0, 340px) minmax(0, 1fr) minmax(0, 340px)"
                : "minmax(0, 380px) minmax(0, 1fr)",
            }}
          >
            <WhatsappConversationsListBlock vm={vm} />
            {/* Desktop keeps navigation on the list pane, so the thread pane carries no back button. */}
            <WhatsappConversationsWorkspacePane vm={vm} showThreadBackButton={false} />
            {showRecipients ? <WhatsappConversationsRecipientsBlock vm={vm} /> : null}
          </Box>
        </Stack>
      )}
    </DesktopPageContainer>
  );
}
