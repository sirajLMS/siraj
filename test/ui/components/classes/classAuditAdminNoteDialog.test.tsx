import { afterEach, describe, expect, mock, test } from "bun:test";
import { useEffect, useState } from "react";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

const locale: AppLocale = "ar";
const auditT = readTranslation(Translation.Dashboard.ClassAudit, locale);
const commonLabels = readTranslation(Translation.Common, locale);

const CLASS_INSTANCE_ID = "class-instance-1";

await mockNextNavigation("/dashboard");

// Re-register next/navigation with the class-instance param the ViewModel reads.
await mock.module("next/navigation", () => ({
  useParams: () => ({ id: CLASS_INSTANCE_ID, locale: "en" }),
  useRouter: () => ({ push: mock(() => {}), back: mock(() => {}), forward: mock(() => {}), refresh: mock(() => {}) }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  redirect: mock(() => {}),
}));

// Avoid nav-config / sidebar label resolution inside MobilePageHeader breadcrumbs.
await mock.module("@/frontend/common/views/dashboard/lib/usePageBreadcrumbs", () => ({
  usePageBreadcrumbs: () => [],
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";

expect.extend(matchers);

import {
  groupClassAuditQueryDocument,
  updateClassAdminNoteMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useClassAuditStore } from "@/frontend/common/stores/classAuditStore";
import { ClassAuditView } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditView";
import type { ClassAuditLabels } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import {
  type ClassAuditReadyViewModel,
  type ClassAuditViewModel,
  useClassAuditViewModel,
} from "@/frontend/common/views/dashboard/classes/audit/useClassAuditViewModel";
import {
  buildClassAuditViewLabels,
  classAuditFixture,
  noopHandler,
} from "@/test/ui/components/fixtures/classAuditFixtures";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const auditLabels: ClassAuditLabels = buildClassAuditViewLabels(auditT, classAuditFixture, commonLabels.cancel);

afterEach(() => {
  cleanup();
  useClassAuditStore.getState().reset();
});

function buildReadyViewModel(overrides: Partial<ClassAuditReadyViewModel> = {}): ClassAuditReadyViewModel {
  return {
    status: "ready",
    audit: classAuditFixture,
    labels: auditLabels,
    onGenerateReport: noopHandler,
    onEditClass: noopHandler,
    onExportStudents: noopHandler,
    onViewStudent: noopHandler,
    onResendNotifications: noopHandler,
    onUpdateAdminNote: noopHandler,
    onEditAdminNote: noopHandler,
    isResending: false,
    onRetry: noopHandler,
    adminNoteDialog: {
      open: false,
      content: "",
      isSaving: false,
      onContentChange: noopHandler,
      onClose: noopHandler,
      onSave: noopHandler,
    },
    payroll: null,
    statusEvents: null,
    onOverride: noopHandler,
    payrollOverrideDialog: {
      open: false,
      row: null,
      onClose: noopHandler,
      onApplied: noopHandler,
    },
    ...overrides,
  };
}

const auditQueryMock = {
  request: { query: groupClassAuditQueryDocument, variables: { classInstanceId: CLASS_INSTANCE_ID } },
  result: { data: { groupClassAudit: classAuditFixture } },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const updateNoteMock = {
  request: {
    query: updateClassAdminNoteMutationDocument,
    variables: { classInstanceId: CLASS_INSTANCE_ID, content: classAuditFixture.adminNote?.content ?? "" },
  },
  result: { data: { updateClassAdminNote: classAuditFixture } },
};

interface AdminNoteHarnessProps {
  readonly onSave: () => void;
}

/**
 * Drives the shared view with dialog state held in React state, mirroring how
 * the ViewModel flips `adminNoteDialogOpen` on Edit/Update clicks.
 */
function AdminNoteViewHarness({ onSave }: Readonly<AdminNoteHarnessProps>) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(classAuditFixture.adminNote?.content ?? "");
  const openDialog = () => setOpen(true);
  const viewModel = buildReadyViewModel({
    onEditAdminNote: openDialog,
    onUpdateAdminNote: openDialog,
    adminNoteDialog: {
      open,
      content,
      isSaving: false,
      onContentChange: setContent,
      onClose: () => setOpen(false),
      onSave,
    },
  });
  return <ClassAuditView {...viewModel} />;
}

async function openMobileNoteDialog() {
  const editButton = await waitFor(() => {
    const btn = document.getElementById("admin-note-edit-mobile");
    expect(btn).not.toBeNull();
    if (!btn) {
      throw new Error("mobile Edit button should exist");
    }
    return btn;
  });
  fireEvent.click(editButton);
}

describe("Class audit admin-note dialog wiring", () => {
  test("mobile Edit button opens the dialog prefilled with the current note", async () => {
    renderWithWrapper(<AdminNoteViewHarness onSave={noopHandler} />, { locale, viewport: "mobile" });

    await openMobileNoteDialog();

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(auditT.adminNote.title);
    expect(screen.getByRole("textbox")).toHaveValue(classAuditFixture.adminNote?.content ?? "");
  });

  test("Save triggers the save handler; Cancel closes the dialog", async () => {
    const onSave = mock(() => {});
    renderWithWrapper(<AdminNoteViewHarness onSave={onSave} />, { locale, viewport: "mobile" });

    await openMobileNoteDialog();
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: auditT.adminNote.update }));
    expect(onSave).toHaveBeenCalledTimes(1);

    // Re-open, then cancel: poll until the dialog unmounts. Keep the failing
    // case a tiny plain Error — serialized DOM payloads in waitFor assertions
    // exhaust the runner's memory under Happy DOM for this page.
    await openMobileNoteDialog();
    const reopened = await screen.findByRole("dialog");
    fireEvent.click(within(reopened).getByRole("button", { name: commonLabels.cancel }));
    await waitFor(() => {
      if (document.querySelector('[role="dialog"]')) {
        throw new Error("admin-note dialog still open");
      }
    });
  });

  test("ViewModel Edit opens the store dialog prefilled; Save runs the update mutation and closes it", async () => {
    let captured: ClassAuditViewModel | undefined;
    const readCaptured = (): ClassAuditViewModel | undefined => captured;

    function ViewModelProbe() {
      const viewModel = useClassAuditViewModel();
      useEffect(() => {
        captured = viewModel;
      }, [viewModel]);
      return null;
    }

    renderWithWrapper(<ViewModelProbe />, { locale, mocks: [auditQueryMock, updateNoteMock] });

    await waitFor(() => expect(readCaptured()?.status).toBe("ready"));
    const readyViewModel = readCaptured();
    if (readyViewModel?.status !== "ready") {
      throw new Error("view model should be ready");
    }

    act(() => {
      readyViewModel.onEditAdminNote();
    });
    expect(useClassAuditStore.getState().adminNoteDialogOpen).toBe(true);
    expect(useClassAuditStore.getState().adminNoteDraft).toBe(classAuditFixture.adminNote?.content ?? "");

    act(() => {
      readyViewModel.adminNoteDialog.onSave();
    });
    await waitFor(() => expect(useClassAuditStore.getState().adminNoteDialogOpen).toBe(false));
  });
});
