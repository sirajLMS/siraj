"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import type { RecurringMeetingConfigFormState } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import type { CreateRecurringClassLabels } from "@/shared/locale";

export interface CreateRecurringClassViewProps {
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly errorMessage: string | null;
  readonly meetingConfigWarning?: boolean;
  readonly meetingConfigWarningMessage?: string;
  readonly goToClassLabel?: string;
  readonly onGoToCreatedClass?: () => void;
  readonly labels: CreateRecurringClassLabels;
  readonly onClose: () => void;
  readonly onSubmit: (data: RecurringClassFormData, meetingConfig: RecurringMeetingConfigFormState) => void;
  readonly onDismissSuccess: () => void;
  readonly onDismissError: () => void;
}

const lazyViews = createLazyView<CreateRecurringClassViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/classes/recurring/createRecurringClassView.mobile").then(m => ({
      default: m.CreateRecurringClassViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/classes/recurring/createRecurringClassView.desktop").then(m => ({
      default: m.CreateRecurringClassViewDesktop,
    }))
);

export function CreateRecurringClassView(props: Readonly<CreateRecurringClassViewProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
