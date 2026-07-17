"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { CreateRecurringClassDialogProps } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";

const lazyViews = createLazyView<CreateRecurringClassDialogProps>(
  () =>
    import(
      "@/frontend/mobile/views/dashboard/teachers/schedule/weekly/components/createRecurringClassDialog.mobile"
    ).then(m => ({ default: m.CreateRecurringClassDialogMobile })),
  () =>
    import(
      "@/frontend/desktop/views/dashboard/teachers/schedule/weekly/components/createRecurringClassDialog.desktop"
    ).then(m => ({ default: m.CreateRecurringClassDialogDesktop }))
);

export function CreateRecurringClassDialog(props: Readonly<CreateRecurringClassDialogProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
