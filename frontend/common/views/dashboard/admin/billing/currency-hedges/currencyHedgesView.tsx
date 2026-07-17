"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";

export type HedgeRow = {
  readonly id: string;
  readonly currency: CurrencyCode;
  readonly amount: string;
  readonly hedgeType: string;
  readonly notes: string | null;
  readonly updatedAt: string | null;
};

export interface CurrencyHedgesViewModel {
  readonly rows: readonly HedgeRow[];
  readonly loading: boolean;
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly emptyMessage: string;
  readonly addHedgeLabel: string;
  readonly currencyColumnLabel: string;
  readonly amountColumnLabel: string;
  readonly hedgeTypeColumnLabel: string;
  readonly notesColumnLabel: string;
  readonly updatedAtColumnLabel: string;
  readonly actionsColumnLabel: string;
  readonly editHedgeLabel: string;
  readonly deleteHedgeLabel: string;
  readonly onEdit: (row: HedgeRow) => void;
  readonly onDelete: (row: HedgeRow) => void;
  readonly onAdd: () => void;
}

const lazyViews = createLazyView<CurrencyHedgesViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/billing/currency-hedges/currencyHedges.mobile").then(m => ({
      default: m.CurrencyHedgesMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/billing/currency-hedges/currencyHedges.desktop").then(m => ({
      default: m.CurrencyHedgesDesktopView,
    }))
);

export function CurrencyHedgesView(props: Readonly<CurrencyHedgesViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

export type CurrencyHedgesGridCol = GridColDef<HedgeRow>;
