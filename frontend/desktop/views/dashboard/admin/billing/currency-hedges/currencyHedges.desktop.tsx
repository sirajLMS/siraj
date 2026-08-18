"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type {
  CurrencyHedgesViewModel,
  HedgeRow,
} from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/useCurrencyHedgesViewModel";
import { buildCurrencyHedgeColumns } from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/utils";
import {
  DesktopAppDataGrid,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { useAppLocale } from "@/shared/locale";

export function CurrencyHedgesDesktopView({
  labelsBySection,
  rows,
  loading,
  onEdit,
  onDelete,
  onAdd,
}: Readonly<CurrencyHedgesViewModel>) {
  const locale = useAppLocale();
  const { shell, columns, actions } = labelsBySection;

  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid
  const gridColumns = useMemo<readonly GridColDef<HedgeRow>[]>(
    () =>
      buildCurrencyHedgeColumns(
        { ...columns, editHedge: actions.editHedge, deleteHedge: actions.deleteHedge },
        { onEdit, onDelete },
        locale
      ),
    [actions.deleteHedge, actions.editHedge, columns, locale, onEdit, onDelete]
  );

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={shell.pageTitle}
        subtitle={shell.pageSubtitle}
        actions={<DesktopPrimaryPageAction onClick={onAdd}>{actions.addHedge}</DesktopPrimaryPageAction>}
      />
      <DesktopSectionPanel contentPadding={false}>
        <DesktopAppDataGrid
          rows={rows}
          columns={gridColumns}
          loading={loading}
          emptyMessage={shell.empty}
          getRowId={row => row.id}
          paginationOptions={{ mode: "client" }}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
