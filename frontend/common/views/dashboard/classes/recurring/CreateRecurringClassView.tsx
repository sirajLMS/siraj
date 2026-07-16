"use client";

import { useViewport } from "@/frontend/common/hooks/useViewport";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import type { RecurringMeetingConfigFormState } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import { CreateRecurringClassViewDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/createRecurringClassView.desktop";
import { CreateRecurringClassViewMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/createRecurringClassView.mobile";
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

export function CreateRecurringClassView(props: Readonly<CreateRecurringClassViewProps>) {
  const { isMobile } = useViewport();

  if (isMobile) {
    return <CreateRecurringClassViewMobile {...props} />;
  }

  return <CreateRecurringClassViewDesktop {...props} />;
}
