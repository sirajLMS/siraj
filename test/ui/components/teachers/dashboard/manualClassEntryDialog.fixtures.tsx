import { fireEvent, screen } from "@testing-library/react";
import type {
  ManualClassEntryDialogProps,
  ManualClassEntrySubmitData,
} from "@/frontend/common/views/dashboard/teachers/dashboard/components/ManualClassEntryDialog";
import { useManualClassEntryStudentField } from "@/frontend/common/views/dashboard/teachers/dashboard/components/useManualClassEntryStudentField";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

export const dialogLocale: AppLocale = "en";
const teacherDashboardTranslations = readTranslation(Translation.Dashboard.TeacherDashboard, dialogLocale);
export const manualEntryLabels = teacherDashboardTranslations.manualClassEntry;

export const MANUAL_ENTRY_STUDENT_ID = "student-1";
export const MANUAL_ENTRY_SUBJECT = { id: "subject-1", name: "Chemistry" } as const;

const STUB_SELECT_STUDENT_LABEL = "Stub: select student";

/** Stands in for the tier-owned student selector and drives the field context. */
function ManualEntryStudentStub() {
  const { setStudentId } = useManualClassEntryStudentField();
  return (
    <button type="button" onClick={() => setStudentId(MANUAL_ENTRY_STUDENT_ID)}>
      {STUB_SELECT_STUDENT_LABEL}
    </button>
  );
}

export interface ManualEntryRenderOverrides {
  readonly onSubmit?: (data: ManualClassEntrySubmitData) => Promise<void>;
  readonly onClose?: () => void;
  readonly defaultActive?: boolean;
}

export function makeManualEntryProps(overrides: ManualEntryRenderOverrides = {}): ManualClassEntryDialogProps {
  return {
    open: true,
    onClose: () => {},
    onSubmit: async () => {},
    studentSelect: <ManualEntryStudentStub />,
    subjects: [MANUAL_ENTRY_SUBJECT],
    subjectsLoading: false,
    labels: manualEntryLabels,
    ...overrides,
  };
}

/** Selects the stubbed student + subject, then submits the form. */
export function fillAndSubmitManualEntry(): void {
  selectManualEntryStudent();
  selectManualEntrySubject();
  clickManualEntryCreate();
}

/** Picks the fixture student through the field-context stub. */
export function selectManualEntryStudent(): void {
  fireEvent.click(screen.getByRole("button", { name: STUB_SELECT_STUDENT_LABEL }));
}

/** Picks the fixture subject through the subject selector combobox. */
export function selectManualEntrySubject(): void {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: manualEntryLabels.subjectLabel }));
  fireEvent.click(screen.getByRole("option", { name: MANUAL_ENTRY_SUBJECT.name }));
}

/** The create button stays at the bottom of the actions row in every variant. */
export function clickManualEntryCreate(): void {
  fireEvent.click(screen.getByRole("button", { name: manualEntryLabels.create }));
}
