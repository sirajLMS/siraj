"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ConnectedAccountsTableProps } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";

const lazyViews = createLazyView<ConnectedAccountsTableProps>(
  () =>
    import(
      "@/frontend/mobile/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.mobile"
    ).then(m => ({
      default: m.ConnectedAccountsTableMobile,
    })),
  () =>
    import(
      "@/frontend/desktop/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.desktop"
    ).then(m => ({
      default: m.ConnectedAccountsTableDesktop,
    }))
);

export function ConnectedAccountsTable(props: Readonly<ConnectedAccountsTableProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
