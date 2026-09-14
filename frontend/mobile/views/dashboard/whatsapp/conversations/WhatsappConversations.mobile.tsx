"use client";

import { AddOutlined, LockOutlined, WhatsApp as WhatsappIcon } from "@mui/icons-material";
import { Alert, Button, Chip, Typography } from "@mui/material";
import type { ConversationListShellArgs } from "@/frontend/common/views/dashboard/whatsapp/conversations/ConversationListShared";
import {
  WhatsappConversationsBanner,
  WhatsappConversationsListBlock,
  WhatsappConversationsRecipientsBlock,
  WhatsappConversationsWorkspacePane,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/ConversationsWorkspaceShared";
import type { WhatsappConversationsViewModel } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";
import { MobileCardList, MobileEmptyState } from "@/frontend/mobile/components/ui";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button/MobileActionButtons";
import { MobileContentInset, MobileContentStack, MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
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
    <MobilePrimaryPageAction size="small" startIcon={<AddOutlined />} onClick={onStart} disabled={disabled}>
      {label}
    </MobilePrimaryPageAction>
  );
}

/**
 * Mobile shell for the conversation list scaffold: edge-to-edge section panel
 * whose action bar carries the account selector + search, wrapping the
 * edge-to-edge card list (the skeleton/empty branches own their own inset).
 */
function MobileConversationListShell(args: ConversationListShellArgs) {
  return (
    <MobileSectionPanel actions={args.toolbar} contentInset={false}>
      {args.skeleton}
      {args.empty}
      {args.rows.length > 0 && (
        <MobileCardList
          rows={args.rows}
          renderItem={args.renderRow}
          getKey={row => row.id}
          layout="edge-to-edge"
          paginationOptions={args.paginationOptions}
        />
      )}
    </MobileSectionPanel>
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
          <MobileEmptyState
            title={shell.noAccountsTitle}
            subtitle={shell.noAccountsDescription}
            icon={<WhatsappIcon sx={{ fontSize: 48, color: theme => theme.palette.text.secondary }} />}
          />
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
            {threadOpen ? (
              <MobileContentInset>
                <WhatsappConversationsWorkspacePane vm={vm} />
              </MobileContentInset>
            ) : (
              <WhatsappConversationsListBlock vm={vm} listShell={MobileConversationListShell} />
            )}
            <MobileContentInset>
              <WhatsappConversationsRecipientsBlock vm={vm} />
            </MobileContentInset>
          </>
        )}
      </MobileContentStack>
    </MobilePageContainer>
  );
}
