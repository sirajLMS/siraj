"use client";

import { AddOutlined, LockOutlined, SyncOutlined } from "@mui/icons-material";
import { Alert, Button, Chip, Stack, Typography } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui/button/ActionButtons";
import type { GroupsListShellArgs } from "@/frontend/common/views/dashboard/whatsapp/groups/GroupsListShared";
import { NoWhatsappGroupsAccountsState } from "@/frontend/common/views/dashboard/whatsapp/groups/NoWhatsappGroupsAccountsState";
import type { WhatsappGroupsViewModel } from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";
import {
  WhatsappGroupsCreateDialog,
  WhatsappGroupsDetailBlock,
  WhatsappGroupsListBlock,
  WhatsappGroupsNotice,
} from "@/frontend/common/views/dashboard/whatsapp/groups/WhatsappGroupsWorkspaceShared";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { DesktopPaginationControls } from "@/frontend/desktop/components/ui/filter";

function HeaderActions({ vm }: Readonly<{ vm: WhatsappGroupsViewModel }>) {
  if (!vm.canManage) {
    // Neutral outlined Chip — no StatusBadge category represents permission-denied chrome.
    return (
      <Chip size="small" variant="outlined" icon={<LockOutlined />} label={vm.labelsBySection.shell.permissionDenied} />
    );
  }
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <FilterButton
        size="small"
        startIcon={<SyncOutlined />}
        onClick={vm.onSyncGroups}
        disabled={vm.syncing || vm.accounts.length === 0}
      >
        {vm.labelsBySection.shell.syncGroups}
      </FilterButton>
      <PrimaryPageAction
        size="small"
        startIcon={<AddOutlined />}
        onClick={vm.onOpenCreate}
        disabled={vm.accounts.length === 0}
      >
        {vm.labelsBySection.shell.createGroup}
      </PrimaryPageAction>
    </Stack>
  );
}

/**
 * Desktop list shell for the groups workspace: bordered SectionPanel with the
 * search toolbar in the actions bar, the row list, and the pagination bar.
 */
function DesktopGroupsListShell(args: GroupsListShellArgs) {
  const { toolbar, skeleton, empty, rows, renderRow, paginationOptions, rowsAriaLabel } = args;
  const pageCount = Math.max(1, Math.ceil(paginationOptions.totalCount / paginationOptions.pageSize));
  return (
    <SectionPanel actions={toolbar}>
      {skeleton}
      {empty}
      {rows.length > 0 && <Stack aria-label={rowsAriaLabel}>{rows.map(row => renderRow(row))}</Stack>}
      {rows.length > 0 && (
        <DesktopPaginationControls
          page={paginationOptions.page}
          pageCount={pageCount}
          rowCount={paginationOptions.totalCount}
          pageSize={paginationOptions.pageSize}
          onPageChange={paginationOptions.onPageChange}
        />
      )}
    </SectionPanel>
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
        <SectionPanel>
          <NoWhatsappGroupsAccountsState labels={shell.noAccountsState} />
        </SectionPanel>
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
            <WhatsappGroupsListBlock vm={vm} listShell={DesktopGroupsListShell} />
            {groupOpen ? <WhatsappGroupsDetailBlock vm={vm} /> : null}
          </Stack>
        </Stack>
      )}
      <WhatsappGroupsCreateDialog vm={vm} />
    </DesktopPageContainer>
  );
}
