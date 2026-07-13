"use client";

import { useViewport } from "@/frontend/common/hooks/useViewport";
import { CreateRecurringClassViewDesktop } from "@/frontend/views/dashboard/classes/recurring/createRecurringClassView.desktop";
import { CreateRecurringClassViewMobile } from "@/frontend/views/dashboard/classes/recurring/createRecurringClassView.mobile";
import type { RecurringClassFormData } from "@/frontend/views/dashboard/classes/recurring/recurringClassSchema";
import type { RecurringMeetingConfigFormState } from "@/frontend/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import type { CreateRecurringClassLabels } from "@/shared/messages/types/message";

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
