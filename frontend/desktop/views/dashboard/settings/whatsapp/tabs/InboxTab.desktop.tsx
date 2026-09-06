"use client";

import { Box } from "@mui/material";
import type { GridColDef, GridEventListener } from "@mui/x-data-grid";
import { useMemo } from "react";
import { StatusBadge } from "@/frontend/common/components/ui";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ConversationThread } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/ConversationThread";
import { InboxTabContent } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/InboxTabContent";
import type {
  WhatsappConversationRow,
  WhatsappInboxViewModel,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";
import { getWhatsappPurposeBadgeConfig } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappStatusBadge";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid";

function buildColumns(vm: WhatsappInboxViewModel): GridColDef<WhatsappConversationRow>[] {
  const t = vm.labels;
  return [
    {
      field: "displayName",
      headerName: t.columnContact,
      flex: 1,
      minWidth: 180,
      valueGetter: (_value, row) => row.displayName ?? row.username ?? row.waId ?? "",
    },
    {
      field: "lastMessagePreview",
      headerName: t.columnLastMessage,
      flex: 1.4,
      minWidth: 220,
      renderCell: ({ value }) => value ?? "—",
    },
    {
      field: "accountPurpose",
      headerName: t.columnAccount,
      flex: 0.6,
      minWidth: 130,
      renderCell: ({ value }) => {
        const purpose = typeof value === "string" ? value : null;
        const badge = getWhatsappPurposeBadgeConfig(purpose);
        return <StatusBadge category={badge.category} status={badge.status} label={vm.purposeLabel(purpose)} />;
      },
    },
    {
      field: "lastMessageAt",
      headerName: t.columnLastActivity,
      flex: 0.6,
      minWidth: 150,
      renderCell: ({ row }) => vm.formatTimestamp(row.lastMessageAt),
    },
  ];
}
/**
 * Desktop inbox tab: conversations grid (server-paginated via the ViewModel)
 * with row click opening the read-only thread pane beside the list.
 */
export function InboxTabDesktop(vm: Readonly<WhatsappInboxViewModel>) {
  const columns = useMemo(() => buildColumns(vm), [vm]);

  const handleRowClick: GridEventListener<"rowClick"> = params => {
    vm.onSelectConversation(params.id.toString());
  };

  const list = (
    <DesktopAppDataGrid
      rows={vm.conversations}
      columns={columns}
      getRowId={row => row.id}
      loading={vm.loading}
      emptyMessage={vm.labels.noConversations}
      ariaLabel={vm.labels.title}
      onRowClick={handleRowClick}
      rowSelection={false}
      paginationOptions={buildServerPaginationOptions({
        page: vm.page,
        pageSize: vm.pageSize,
        totalCount: vm.totalCount,
        onPageChange: vm.onPageChange,
      })}
      sx={{ cursor: "pointer" }}
    />
  );

  if (vm.selectedConversation === null) {
    return <InboxTabContent {...vm}>{list}</InboxTabContent>;
  }

  return (
    <InboxTabContent {...vm}>
      <Box
        sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 380px)", gap: 2, alignItems: "start" }}
      >
        {list}
        <ConversationThread
          title={vm.selectedConversation.displayName ?? vm.selectedConversation.waId ?? ""}
          subtitle={vm.selectedConversation.waId ?? ""}
          messages={vm.threadMessages}
          labels={vm.labels}
          loading={vm.threadLoading}
          formatTimestamp={vm.formatTimestamp}
          onBack={vm.onCloseThread}
        />
      </Box>
    </InboxTabContent>
  );
}
