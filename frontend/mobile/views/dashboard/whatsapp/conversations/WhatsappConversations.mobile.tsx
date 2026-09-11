"use client";

import { AddOutlined, LockOutlined } from "@mui/icons-material";
import { Alert, Button, Chip, Typography } from "@mui/material";
import {
  WhatsappConversationsBanner,
  WhatsappConversationsListBlock,
  WhatsappConversationsRecipientsBlock,
  WhatsappConversationsWorkspacePane,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/ConversationsWorkspaceShared";
import { NoWhatsappAccountsState } from "@/frontend/common/views/dashboard/whatsapp/conversations/NoWhatsappAccountsState";
import type { WhatsappConversationsViewModel } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";
import { MobileContentInset, MobileContentStack } from "@/frontend/mobile/components/ui/container";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";

function ReadOnlyChipMobile({ label }: Readonly<{ label: string }>) {
  return <Chip size="small" variant="outlined" icon={<LockOutlined />} label={label} />;
}

function NewConversationActionMobile({
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
 * Mobile layout for the `/whatsapp` conversations workspace: stacked blocks
 * (banner, list, workspace pane, recipients panel); a selected conversation
 * swaps the list for the full-width thread with a back action.
 */
export function WhatsappConversationsMobileView(vm: Readonly<WhatsappConversationsViewModel>) {
  const { shell, list } = vm.labelsBySection;
  const noAccounts = !vm.accountsLoading && vm.accounts.length === 0;
  const threadOpen = vm.selectedConversation !== null || vm.isInitiating;

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={shell.title}
        subtitle={shell.subtitle}
        actions={
          vm.canManage ? (
            <NewConversationActionMobile
              label={shell.newConversation}
              disabled={vm.accounts.length === 0}
              onStart={vm.onStartNewConversation}
            />
          ) : (
            <ReadOnlyChipMobile label={shell.readOnlyBadge} />
          )
        }
      />
      <MobileContentStack>
        {noAccounts ? (
          <MobileContentInset>
            <NoWhatsappAccountsState labels={shell} />
          </MobileContentInset>
        ) : (
          <>
            {vm.conversationsError ? (
              <MobileContentInset>
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
              </MobileContentInset>
            ) : null}
            <MobileContentInset>
              <WhatsappConversationsBanner vm={vm} />
            </MobileContentInset>
            <MobileContentInset>
              {threadOpen ? <WhatsappConversationsWorkspacePane vm={vm} /> : <WhatsappConversationsListBlock vm={vm} />}
            </MobileContentInset>
            <MobileContentInset>
              <WhatsappConversationsRecipientsBlock vm={vm} />
            </MobileContentInset>
          </>
        )}
      </MobileContentStack>
    </MobilePageContainer>
  );
}
