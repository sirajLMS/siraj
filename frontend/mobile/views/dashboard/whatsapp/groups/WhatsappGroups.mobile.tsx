"use client";

import { AddOutlined, ArrowBackOutlined, LockOutlined, SyncOutlined } from "@mui/icons-material";
import { Alert, Button, Chip, IconButton, Stack, Typography } from "@mui/material";
import { NoWhatsappGroupsAccountsState } from "@/frontend/common/views/dashboard/whatsapp/groups/NoWhatsappGroupsAccountsState";
import type { WhatsappGroupsViewModel } from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";
import {
  WhatsappGroupsCreateDialog,
  WhatsappGroupsDetailBlock,
  WhatsappGroupsListBlock,
  WhatsappGroupsNotice,
} from "@/frontend/common/views/dashboard/whatsapp/groups/WhatsappGroupsWorkspaceShared";
import { MobileContentInset, MobileContentStack } from "@/frontend/mobile/components/ui/container";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";

function HeaderActionsMobile({ vm }: Readonly<{ vm: WhatsappGroupsViewModel }>) {
  if (!vm.canManage) {
    return (
      <Chip size="small" variant="outlined" icon={<LockOutlined />} label={vm.labelsBySection.shell.permissionDenied} />
    );
  }
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
      <IconButton
        size="small"
        onClick={vm.onSyncGroups}
        disabled={vm.syncing || vm.accounts.length === 0}
        aria-label={vm.labelsBySection.shell.syncGroups}
      >
        <SyncOutlined fontSize="small" />
      </IconButton>
      <Button
        size="small"
        variant="outlined"
        startIcon={<AddOutlined />}
        onClick={vm.onOpenCreate}
        disabled={vm.accounts.length === 0}
      >
        {vm.labelsBySection.shell.createGroup}
      </Button>
    </Stack>
  );
}

/**
 * Mobile layout for the `/whatsapp` groups workspace: stacked blocks; a
 * selected group drills in — the list swaps for the full-width detail pane
 * with a back action.
 */
export function WhatsappGroupsMobileView(vm: Readonly<WhatsappGroupsViewModel>) {
  const { shell } = vm.labelsBySection;
  const noAccounts = !vm.accountsLoading && vm.accounts.length === 0;
  const groupOpen = vm.selectedGroupId !== null;

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={shell.title}
        subtitle={shell.subtitle}
        actions={
          groupOpen ? (
            <IconButton onClick={vm.onCloseGroup} aria-label={vm.commonLabels.cancel} size="small">
              <ArrowBackOutlined />
            </IconButton>
          ) : (
            <HeaderActionsMobile vm={vm} />
          )
        }
      />
      <MobileContentStack>
        {noAccounts ? (
          <MobileContentInset>
            <NoWhatsappGroupsAccountsState labels={shell.noAccountsState} />
          </MobileContentInset>
        ) : (
          <>
            <MobileContentInset>
              <WhatsappGroupsNotice vm={vm} />
            </MobileContentInset>
            {vm.groupsError ? (
              <MobileContentInset>
                <Alert
                  severity="error"
                  component="div"
                  action={
                    <Button color="inherit" size="small" onClick={vm.onRetryGroups}>
                      {vm.labelsBySection.list.refresh}
                    </Button>
                  }
                >
                  <Typography variant="bodyMd">{vm.labelsBySection.list.errorGeneric}</Typography>
                </Alert>
              </MobileContentInset>
            ) : null}
            <MobileContentInset>
              {groupOpen ? <WhatsappGroupsDetailBlock vm={vm} /> : <WhatsappGroupsListBlock vm={vm} />}
            </MobileContentInset>
          </>
        )}
      </MobileContentStack>
      <WhatsappGroupsCreateDialog vm={vm} />
    </MobilePageContainer>
  );
}
