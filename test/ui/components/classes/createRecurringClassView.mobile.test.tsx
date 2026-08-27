import { afterEach, describe, expect, mock, test } from "bun:test";
import { createElement } from "react";

// Stub the tier form so the snackbar wiring is exercised in isolation from
// the form fields (which require Apollo mocks and additional namespaces).
await mock.module("@/frontend/mobile/views/dashboard/classes/recurring/components/recurringClassForm.mobile", () => ({
  RecurringClassFormMobile: () => createElement("div", { "data-testid": "recurring-class-form" }),
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";

expect.extend(matchers);

import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import type { CreateRecurringClassViewModel } from "@/frontend/common/views/dashboard/classes/recurring/useCreateRecurringClassViewModel";
import { buildRecurringClassFormLabels } from "@/frontend/common/views/dashboard/classes/recurring/utils/buildRecurringClassFormLabels";
import { emptyRecurringMeetingConfigState } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import { CreateRecurringClassViewMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/createRecurringClassView.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

await mockNextNavigation();

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Dashboard.CreateRecurringClass, locale);
const meetingLabels = readTranslation(Translation.Ui.MeetingConfig, locale);
const recurringScheduleLabels = readTranslation(Translation.Ui.MeetingConfigRecurringSchedule, locale);

const CUSTOM_SUBMIT_ERROR = "Custom submit failure message";

interface HarnessProps {
  readonly showSuccess?: boolean;
  readonly errorMessage?: string | null;
  readonly onDismissSuccess?: () => void;
  readonly onDismissError?: () => void;
}

function buildLabelsBySection(): CreateRecurringClassViewModel["labelsBySection"] {
  return {
    shell: {
      title: labels.title,
      subtitle: labels.subtitle,
      breadcrumbs: labels.breadcrumbs,
      close: labels.close,
      addedSuccessfully: labels.addedSuccessfully,
    },
    form: buildRecurringClassFormLabels(labels),
    page: labels,
    notifications: {
      meetingConfigWarningMessage: meetingLabels.manager.postCreateFailure,
      goToClassLabel: recurringScheduleLabels.goToClass,
    },
  };
}

// Uses a real useForm instance so the view receives realistically typed hooks;
// the consumer-component pattern is required because renderHook is unavailable.
function MobileViewHarness({
  showSuccess = false,
  errorMessage = null,
  onDismissSuccess,
  onDismissError,
}: HarnessProps) {
  const form = useForm<RecurringClassFormData>();
  const viewModel: CreateRecurringClassViewModel = {
    isSubmitting: false,
    showSuccess,
    errorMessage,
    meetingConfigWarning: false,
    labelsBySection: buildLabelsBySection(),
    onGoToCreatedClass: () => {},
    onClose: () => {},
    onSubmit: () => {},
    onDismissSuccess: onDismissSuccess ?? (() => {}),
    onDismissError: onDismissError ?? (() => {}),
    meetingConfig: emptyRecurringMeetingConfigState(),
    onMeetingConfigChange: () => {},
    register: form.register,
    handleSubmit: form.handleSubmit,
    watch: form.watch,
    setValue: form.setValue,
    control: form.control,
    errors: form.formState.errors,
  };
  return <CreateRecurringClassViewMobile {...viewModel} />;
}

describe("CreateRecurringClassViewMobile snackbars", () => {
  afterEach(() => {
    cleanup();
  });

  test("shows the shared success snackbar with the localized message when showSuccess is true", async () => {
    renderWithWrapper(<MobileViewHarness showSuccess />, { locale, viewport: "mobile" });

    await waitFor(() => {
      expect(screen.getByText(labels.addedSuccessfully)).toBeVisible();
    });
  });

  test("does not render the success snackbar message when showSuccess is false", () => {
    renderWithWrapper(<MobileViewHarness />, { locale, viewport: "mobile" });

    expect(screen.queryByText(labels.addedSuccessfully)).toBeNull();
  });

  test("shows the shared error snackbar with the view model error message", async () => {
    renderWithWrapper(<MobileViewHarness errorMessage={CUSTOM_SUBMIT_ERROR} />, { locale, viewport: "mobile" });

    await waitFor(() => {
      expect(screen.getByText(CUSTOM_SUBMIT_ERROR)).toBeVisible();
    });
  });

  test("does not render the error snackbar message when errorMessage is null", () => {
    renderWithWrapper(<MobileViewHarness errorMessage={CUSTOM_SUBMIT_ERROR} />, { locale, viewport: "mobile" });
    cleanup();

    renderWithWrapper(<MobileViewHarness />, { locale, viewport: "mobile" });
    expect(screen.queryByText(CUSTOM_SUBMIT_ERROR)).toBeNull();
  });

  test("invokes onDismissError when the error snackbar is dismissed", async () => {
    const onDismissError = mock(() => {});
    renderWithWrapper(<MobileViewHarness errorMessage={CUSTOM_SUBMIT_ERROR} onDismissError={onDismissError} />, {
      locale,
      viewport: "mobile",
    });

    await waitFor(() => {
      expect(screen.getByText(CUSTOM_SUBMIT_ERROR)).toBeVisible();
    });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onDismissError).toHaveBeenCalled();
  });
});
