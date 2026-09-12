"use client";

import { AddOutlined, LockOutlined, SyncOutlined } from "@mui/icons-material";
import { Alert, Button, Chip, Stack, Typography } from "@mui/material";
import { NoWhatsappGroupsAccountsState } from "@/frontend/common/views/dashboard/whatsapp/groups/NoWhatsappGroupsAccountsState";
import type { WhatsappGroupsViewModel } from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";
import {
  WhatsappGroupsCreateDialog,
  WhatsappGroupsDetailBlock,
  WhatsappGroupsListBlock,
  WhatsappGroupsNotice,
} from "@/frontend/common/views/dashboard/whatsapp/groups/WhatsappGroupsWorkspaceShared";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

function HeaderActions({ vm }: Readonly<{ vm: WhatsappGroupsViewModel }>) {
  if (!vm.canManage) {
    return (
      <Chip size="small" variant="outlined" icon={<LockOutlined />} label={vm.labelsBySection.shell.permissionDenied} />
    );
  }
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<SyncOutlined />}
        onClick={vm.onSyncGroups}
        disabled={vm.syncing || vm.accounts.length === 0}
      >
        {vm.labelsBySection.shell.syncGroups}
      </Button>
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
 * Desktop layout for the `/whatsapp` groups workspace: groups list beside the
 * management detail pane (with the message thread docked below it); desktop
 * keeps navigation on the list pane.
 */
export function WhatsappGroupsDesktopView(vm: Readonly<WhatsappGroupsViewModel>) {
  const { shell } = vm.labelsBySection;
  const noAccounts = !vm.accountsLoading && vm.accounts.length === 0;
  const groupOpen = vm.selectedGroupId !== null;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={shell.title} subtitle={shell.subtitle} actions={<HeaderActions vm={vm} />} />
      {noAccounts ? (
        <NoWhatsappGroupsAccountsState labels={shell.noAccountsState} />
      ) : (
        <Stack spacing={2}>
          <WhatsappGroupsNotice vm={vm} />
          {vm.groupsError && (
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
          )}
          <Stack
            sx={{
              display: "grid",
              gap: 2,
              alignItems: "start",
              gridTemplateColumns: groupOpen ? "minmax(0, 380px) minmax(0, 1fr)" : "minmax(0, 1fr)",
            }}
          >
            <WhatsappGroupsListBlock vm={vm} />
            {groupOpen ? <WhatsappGroupsDetailBlock vm={vm} /> : null}
          </Stack>
        </Stack>
      )}
      <WhatsappGroupsCreateDialog vm={vm} />
    </DesktopPageContainer>
  );
}
