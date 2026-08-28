import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { useState } from "react";

expect.extend(matchers);

import { ClassDetailsContainerBody } from "@/frontend/common/views/dashboard/classes/details/components/classDetailsContainerBody";
import { ClassDetailsContentShared } from "@/frontend/common/views/dashboard/classes/details/components/classDetailsContentShared";
import type { ClassDetailsViewModel } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel";
import type { ClassDetailsContentProps } from "@/frontend/common/views/dashboard/classes/details/types";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import {
  buildClassDetailsContentProps,
  ClassDetailsHeaderStub,
  ClassDetailsStubMetricGrid,
  makeClassDetailsInstance,
} from "@/test/ui/components/fixtures/classDetailsFixtures";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const t = readTranslation(Translation.Dashboard.ClassDetails, locale);
const session = readTranslation(Translation.Session, locale);

function StubPageContainer({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div data-testid="page-container">{children}</div>;
}

/**
 * Pairs the real shared content body with lightweight chrome slots so the
 * container's delete/generate-log wiring can be exercised end to end.
 */
function ClassDetailsContentHarness(props: Readonly<ClassDetailsContentProps>) {
  return (
    <ClassDetailsContentShared
      props={props}
      slots={{
        Header: ClassDetailsHeaderStub,
        TeacherPerformanceMetricGrid: ClassDetailsStubMetricGrid,
        LivePerformanceMetricGrid: ClassDetailsStubMetricGrid,
      }}
    />
  );
}

const harnessSlots = {
  PageContainer: StubPageContainer,
  ClassDetailsContent: ClassDetailsContentHarness,
};

interface WiredViewModelOptions {
  readonly setDeleteDialogOpen: (value: boolean) => void;
  readonly deleteDialogOpen: boolean;
  readonly onGenerateLog: () => void;
  readonly handleDeleteConfirm: () => Promise<void>;
}

function buildReadyViewModel(opts: WiredViewModelOptions): ClassDetailsViewModel {
  const contentProps = buildClassDetailsContentProps(t, session, { canOverride: true });
  return {
    status: "ready",
    instance: makeClassDetailsInstance(),
    canOverride: contentProps.canOverride,
    isParentView: false,
    isStudentView: false,
    canViewSessionDetails: false,
    isWarningDismissed: true,
    setIsWarningDismissed: () => {},
    handlers: {
      ...contentProps.handlers,
      handleDeleteConfirm: opts.handleDeleteConfirm,
    },
    sessionActionProps: contentProps.sessionActionProps,
    feedbackState: null,
    deleteDialogOpen: opts.deleteDialogOpen,
    setDeleteDialogOpen: opts.setDeleteDialogOpen,
    onGenerateLog: opts.onGenerateLog,
    overrideRateDialog: contentProps.overrideRateDialog,
    t,
    headerLabels: contentProps.headerLabels,
    formattedScheduledDate: contentProps.formattedScheduledDate,
    formattedStartTime: contentProps.formattedStartTime,
    formattedEndTime: contentProps.formattedEndTime,
  };
}

interface HarnessProps {
  readonly onGenerateLog: () => void;
  readonly handleDeleteConfirm: () => Promise<void>;
}

/**
 * Mirrors the store-backed wiring of the production container: the dialog flag
 * is flipped through `setDeleteDialogOpen` and the body re-renders with it.
 */
function ClassDetailsWiringHarness({ onGenerateLog, handleDeleteConfirm }: Readonly<HarnessProps>) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const viewModel = buildReadyViewModel({
    deleteDialogOpen,
    setDeleteDialogOpen,
    onGenerateLog,
    handleDeleteConfirm,
  });
  return <ClassDetailsContainerBody viewModel={viewModel} slots={harnessSlots} />;
}

describe("Class details action wiring", () => {
  test("clicking delete opens the confirmation dialog and confirm runs handleDeleteConfirm", async () => {
    const handleDeleteConfirm = mock(() => Promise.resolve());
    renderWithWrapper(
      <ClassDetailsWiringHarness onGenerateLog={() => {}} handleDeleteConfirm={handleDeleteConfirm} />,
      { locale }
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t.adminActions.deleteInstance }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(t.deleteConfirm.title)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t.deleteConfirm.confirm }));
    await waitFor(() => expect(handleDeleteConfirm).toHaveBeenCalledTimes(1));
  });

  test("clicking generate log triggers the event-log download handler", async () => {
    const onGenerateLog = mock(() => {});
    renderWithWrapper(
      <ClassDetailsWiringHarness onGenerateLog={onGenerateLog} handleDeleteConfirm={() => Promise.resolve()} />,
      { locale }
    );

    fireEvent.click(screen.getByRole("button", { name: t.adminActions.generateLog }));
    await waitFor(() => expect(onGenerateLog).toHaveBeenCalledTimes(1));
  });
});
