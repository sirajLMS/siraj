"use client";

import {
  AddOutlined,
  ArrowBackOutlined,
  LockOutlined,
  SyncOutlined,
  WhatsApp as WhatsappIcon,
} from "@mui/icons-material";
import { Alert, Button, Chip, IconButton, Stack, Typography } from "@mui/material";
import type { GroupsListShellArgs } from "@/frontend/common/views/dashboard/whatsapp/groups/GroupsListShared";
import type { WhatsappGroupsViewModel } from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";
import {
  WhatsappGroupsCreateDialog,
  WhatsappGroupsDetailBlock,
  WhatsappGroupsListBlock,
  WhatsappGroupsNotice,
} from "@/frontend/common/views/dashboard/whatsapp/groups/WhatsappGroupsWorkspaceShared";
import { MobileCardList, MobileEmptyState } from "@/frontend/mobile/components/ui";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button/MobileActionButtons";
import { MobileContentInset, MobileContentStack, MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";

function HeaderActionsMobile({ vm }: Readonly<{ vm: WhatsappGroupsViewModel }>) {
  if (!vm.canManage) {
    // Neutral outlined chip — read-only users get a status affordance, not actions.
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
      <MobilePrimaryPageAction
        size="small"
        startIcon={<AddOutlined />}
        onClick={vm.onOpenCreate}
        disabled={vm.accounts.length === 0}
      >
        {vm.labelsBySection.shell.createGroup}
      </MobilePrimaryPageAction>
    </Stack>
  );
}

/**
 * Mobile list shell for the groups workspace: full-bleed section panel with
 * the search toolbar in the actions bar; the card list owns its own inset
 * (`edge-to-edge` layout), so the panel body is not padded.
 */
function MobileGroupsListShell(args: GroupsListShellArgs) {
  const { toolbar, skeleton, empty, rows, renderRow, paginationOptions } = args;
  return (
    <MobileSectionPanel actions={toolbar} contentInset={false}>
      {skeleton}
      {empty}
      {rows.length > 0 && (
        <MobileCardList
          rows={rows}
          renderItem={renderRow}
          getKey={row => row.id}
          layout="edge-to-edge"
          paginationOptions={paginationOptions}
        />
      )}
    </MobileSectionPanel>
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
          <MobileEmptyState
            title={shell.noAccountsState}
            icon={<WhatsappIcon sx={{ fontSize: 48, color: theme => theme.palette.text.secondary }} />}
          />
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
            {groupOpen ? (
              <MobileContentInset>
                <WhatsappGroupsDetailBlock vm={vm} />
              </MobileContentInset>
            ) : (
              <WhatsappGroupsListBlock vm={vm} listShell={MobileGroupsListShell} />
            )}
          </>
        )}
      </MobileContentStack>
      <WhatsappGroupsCreateDialog vm={vm} />
    </MobilePageContainer>
  );
}
