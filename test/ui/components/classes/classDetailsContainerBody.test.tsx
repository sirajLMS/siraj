import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
import { ClassDetailsContainerBody } from "@/frontend/common/views/dashboard/classes/details/components/classDetailsContainerBody";
import type { ClassDetailsContainerSlotProps } from "@/frontend/common/views/dashboard/classes/details/components/types/classDetailsContainerShared.types";
import type { ClassDetailsViewModel } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const classDetails = readTranslation(Translation.Dashboard.ClassDetails, locale);
const session = readTranslation(Translation.Session, locale);

function buildViewModel(status: "invalidId" | "error"): ClassDetailsViewModel {
  return {
    status,
    instance: null,
    canOverride: false,
    isParentView: false,
    isStudentView: false,
    canViewSessionDetails: false,
    isWarningDismissed: false,
    setIsWarningDismissed: () => {},
    handlers: {
      handleForceActivate: async () => {},
      handleStop: async () => {},
      handleActivate: async () => {},
      handleDeleteConfirm: async () => {},
      handleReschedule: () => {},
      handleInfoEdit: () => {},
      handleOverrideRate: async () => {},
    },
    sessionActionProps: {
      onStart: async () => {},
      onAbsent: async () => {},
      onLeave: async () => {},
      onReset: async () => {},
      isStarting: false,
      isMarkingAbsent: false,
      isProcessingLeave: false,
      isResetting: false,
      error: null,
    },
    feedbackState: null,
    deleteDialogOpen: false,
    setDeleteDialogOpen: () => {},
    onGenerateLog: () => {},
    overrideRateDialog: {
      open: false,
      amount: "",
      currency: null,
      onOpen: () => {},
      onClose: () => {},
      onAmountChange: () => {},
      onCurrencyChange: () => {},
      onSubmit: async () => {},
    },
    t: classDetails,
    headerLabels: {
      pageSubtitleAdmin: classDetails.pageSubtitleAdmin,
      pageSubtitleTeacher: classDetails.pageSubtitleTeacher,
      pageSubtitleStudent: classDetails.pageSubtitleStudent,
      classTypes: session.classTypes,
      breadcrumbs: classDetails.breadcrumbs,
    },
    formattedScheduledDate: "",
    formattedStartTime: "",
    formattedEndTime: "",
  };
}

const slots: ClassDetailsContainerSlotProps = {
  PageContainer: ({ children }) => <div data-testid="page-container">{children}</div>,
  ClassDetailsContent: () => <div data-testid="class-details-content" />,
};

describe("ClassDetailsContainerBody", () => {
  test("renders the invalid-id error state via ErrorState", () => {
    renderWithWrapper(<ClassDetailsContainerBody viewModel={buildViewModel("invalidId")} slots={slots} />, {
      locale,
    });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("MuiAlert-colorError");
    expect(alert).toHaveTextContent(classDetails.invalidClassId);
    expect(screen.queryByTestId("page-container")).not.toBeInTheDocument();
  });

  test("renders the load-error state via ErrorState", () => {
    renderWithWrapper(<ClassDetailsContainerBody viewModel={buildViewModel("error")} slots={slots} />, {
      locale,
    });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("MuiAlert-colorError");
    expect(alert).toHaveTextContent(classDetails.loadError);
  });
});
