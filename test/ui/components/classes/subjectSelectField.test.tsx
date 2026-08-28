import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { useForm, useWatch } from "react-hook-form";
import {
  SubjectSelect,
  SubjectSelectField,
} from "@/frontend/common/views/dashboard/classes/recurring/components/SubjectSelectField";
import type { ClassSubjectOption } from "@/frontend/common/views/dashboard/classes/recurring/types";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

await mockNextNavigation();

const locale: AppLocale = "en";

const SUBJECT_LABEL = "Subject";
const SUBJECT_PLACEHOLDER = "Choose a subject";

const FIXTURE_SUBJECTS: readonly ClassSubjectOption[] = [
  { id: "subject-a", name: "Mathematics" },
  { id: "subject-b", name: "Physics" },
];

function openSelectMenu() {
  fireEvent.mouseDown(screen.getByRole("combobox"));
}

describe("SubjectSelect", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders the supplied subject options when the menu opens", () => {
    renderWithWrapper(
      <SubjectSelect
        value=""
        onChange={() => {}}
        label={SUBJECT_LABEL}
        placeholder={SUBJECT_PLACEHOLDER}
        subjects={FIXTURE_SUBJECTS}
        loading={false}
      />,
      { locale }
    );

    openSelectMenu();
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.getByText("Physics")).toBeInTheDocument();
    // The displayEmpty placeholder renders both in the closed combobox and in
    // the menu — assert presence, not uniqueness.
    expect(screen.getAllByText(SUBJECT_PLACEHOLDER).length).toBeGreaterThan(0);
  });

  test("disables the control while options are loading", () => {
    renderWithWrapper(
      <SubjectSelect
        value=""
        onChange={() => {}}
        label={SUBJECT_LABEL}
        placeholder={SUBJECT_PLACEHOLDER}
        subjects={[]}
        loading
      />,
      { locale }
    );

    expect(screen.getByRole("combobox")).toHaveAttribute("aria-disabled", "true");
  });
});

interface SubjectFormData {
  subjectId: string;
}

// The field variant only wires Controller to the presentational select; a real
// useForm instance supplies the control, and a probe renders the watched value.
function SubjectSelectFieldHarness() {
  const { control } = useForm<SubjectFormData>({ defaultValues: { subjectId: "" } });
  const selectedValue = useWatch({ control, name: "subjectId" });
  return (
    <>
      <SubjectSelectField
        name="subjectId"
        control={control}
        label={SUBJECT_LABEL}
        placeholder={SUBJECT_PLACEHOLDER}
        subjects={FIXTURE_SUBJECTS}
        loading={false}
      />
      <div data-testid="subject-value">{selectedValue}</div>
    </>
  );
}

describe("SubjectSelectField", () => {
  afterEach(() => {
    cleanup();
  });

  test("flows fixture options into the field and writes the chosen id to the form", () => {
    renderWithWrapper(<SubjectSelectFieldHarness />, { locale });

    openSelectMenu();
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Physics"));

    expect(screen.getByTestId("subject-value").textContent).toBe("subject-b");
  });
});
