import { afterEach, describe, expect, mock, test } from "bun:test";
import type { TimezoneSelectProps } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

const dialogLocale: AppLocale = "en";

await mockNextNavigation("/teachers", { locale: dialogLocale });

// Record every render of the desktop-tier timezone primitive so tests can assert
// the dialog wires the `TimezoneSelect` slot to `TimezoneSelectDesktop` (not the
// viewport-agnostic common `TimezoneSelect`). The real component still renders
// underneath so DOM behavior stays faithful.
const renderedTimezoneSelectProps: TimezoneSelectProps[] = [];

await mock.module("@/frontend/desktop/components/ui/input/timezoneSelect", async () => {
  const actual = await import("@/frontend/desktop/components/ui/input/timezoneSelect/timezoneSelect.desktop");
  const RecordingTimezoneSelectDesktop = (props: Readonly<TimezoneSelectProps>) => {
    renderedTimezoneSelectProps.push(props);
    return <actual.TimezoneSelectDesktop {...props} />;
  };
  return { TimezoneSelectDesktop: RecordingTimezoneSelectDesktop };
});

import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import type { Dispatch, SetStateAction } from "react";
import { USER_SELECT_LIMIT } from "@/frontend/common/components/ui/input/userSelect/userSelect.constants";
import { ClassType } from "@/frontend/common/graphql/generated/gql/graphql";
import { studentsQueryDocument, userMeetingConfigsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { getTimezoneOptions } from "@/frontend/common/lib/timezone";
import type { RecurringMeetingConfigValidation } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { emptyRecurringMeetingConfigState } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import type { CreateRecurringClassDialogFormState } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type { CreateRecurringClassDialogViewModel } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { CreateRecurringClassDialogDesktop } from "@/frontend/desktop/views/dashboard/teachers/schedule/weekly/components/createRecurringClassDialog.desktop";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

const dialogLabels = readTranslation(Translation.Dashboard.TeacherCreateRecurringClass, dialogLocale);
const meetingLabels = readTranslation(Translation.Ui.MeetingConfig, dialogLocale).manager;
const recurringScheduleLabels = readTranslation(Translation.Ui.MeetingConfigRecurringSchedule, dialogLocale);

const TEACHER_ID = "teacher-1";
const INITIAL_TIMEZONE = IanaTimezone.Africa_Cairo;
const TARGET_TIMEZONE = IanaTimezone.Europe_London;

const meetingConfigValidation: RecurringMeetingConfigValidation = {
  urlError: null,
  fieldsError: null,
  onUrlErrorChange: () => {},
  onFieldsErrorChange: () => {},
  resetErrors: () => {},
  onValidateUrl: () => true,
};

function noopSetter<T>(): Dispatch<SetStateAction<T>> {
  return () => {};
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeFormState(
  setTimezone: CreateRecurringClassDialogFormState["setTimezone"]
): CreateRecurringClassDialogFormState {
  return {
    studentId: "",
    setStudentId: noopSetter(),
    subjectId: "",
    setSubjectId: noopSetter(),
    duration: 60,
    setDuration: noopSetter(),
    defaultStartTime: "09:00",
    setDefaultStartTime: noopSetter(),
    timezone: INITIAL_TIMEZONE,
    setTimezone,
    classType: ClassType.Regular,
    setClassType: noopSetter(),
    meetingConfig: emptyRecurringMeetingConfigState(),
    setMeetingConfig: noopSetter(),
    schedulingMode: null,
    setSchedulingMode: noopSetter(),
    quotaId: null,
    setQuotaId: noopSetter(),
    earmarkedClasses: null,
    setEarmarkedClasses: noopSetter(),
    generationHorizonWeeks: null,
    setGenerationHorizonWeeks: noopSetter(),
    ondemandNoCreditsOutcome: null,
    setOndemandNoCreditsOutcome: noopSetter(),
    meetingConfigWarning: false,
    setMeetingConfigWarning: noopSetter(),
    createdClassInstanceId: null,
    setCreatedClassInstanceId: noopSetter(),
  };
}

function makeViewModel(
  setTimezone: CreateRecurringClassDialogFormState["setTimezone"]
): CreateRecurringClassDialogViewModel {
  return {
    formState: makeFormState(setTimezone),
    days: [],
    toggleDay: () => {},
    toggleTimeOverride: () => {},
    setTimeOverride: () => {},
    mutationLoading: false,
    meetingConfigWarning: false,
    completedClassInstanceId: null,
    isDialogOpen: true,
    closeDialog: () => {},
    validateBeforeSubmit: () => true,
    handleSubmit: () => Promise.resolve(),
    hasSessionCreateClass: true,
    subjects: [],
    subjectsLoading: false,
    meetingConfigValidation,
    labels: dialogLabels,
    meetingLabels,
    recurringScheduleLabels,
    onGoToCreatedClass: () => {},
  };
}

const apolloMocks: MockLink.MockedResponse[] = [
  {
    request: {
      query: studentsQueryDocument,
      variables: {
        paginationArgs: { first: USER_SELECT_LIMIT, page: 1 },
        filterArgs: { primaryTeacherId: TEACHER_ID },
        orderBy: null,
      },
    },
    result: { data: { students: { data: [], pageInfo: { total: 0 } } } },
  },
  {
    request: { query: userMeetingConfigsQueryDocument, variables: { userId: TEACHER_ID } },
    result: { data: { userMeetingConfigs: [] } },
  },
];

function renderDesktopDialog(setTimezone: CreateRecurringClassDialogFormState["setTimezone"] = () => {}) {
  renderedTimezoneSelectProps.length = 0;
  return renderWithWrapper(
    <CreateRecurringClassDialogDesktop teacherId={TEACHER_ID} viewModel={makeViewModel(setTimezone)} />,
    { locale: dialogLocale, mocks: apolloMocks, viewport: "desktop" }
  );
}

afterEach(() => {
  cleanup();
});

describe("CreateRecurringClassDialogDesktop timezone slot", () => {
  test("renders the timezone field through TimezoneSelectDesktop with the translated label and current IANA value", () => {
    renderDesktopDialog();

    const timezoneInput = screen.getByRole("combobox", { name: dialogLabels.fields.timezone });
    expect(timezoneInput).toBeVisible();

    const slotProps = renderedTimezoneSelectProps.at(-1);
    expect(slotProps).toBeDefined();
    expect(slotProps?.label).toBe(dialogLabels.fields.timezone);
    expect(slotProps?.value).toBe(INITIAL_TIMEZONE);
    expect(slotProps?.fullWidth).toBe(true);
    expect(slotProps?.disabled).toBe(false);

    const expectedOption = getTimezoneOptions(dialogLocale).find(option => option.id === INITIAL_TIMEZONE);
    expect(timezoneInput).toHaveValue(expectedOption?.label ?? "");
  });

  test("propagates the chosen IANA timezone to the form state through the desktop slot", async () => {
    const setTimezone = mock<Dispatch<SetStateAction<IanaTimezone>>>(() => {});
    renderDesktopDialog(setTimezone);

    const timezoneInput = screen.getByRole("combobox", { name: dialogLabels.fields.timezone });
    fireEvent.keyDown(timezoneInput, { key: "ArrowDown" });

    const targetOption = getTimezoneOptions(dialogLocale).find(option => option.id === TARGET_TIMEZONE);
    if (!targetOption) {
      throw new Error("target timezone option missing from timezone catalog");
    }
    const optionName = new RegExp(
      `^${escapeRegExp(targetOption.pathLabel)}\\s*\\(${escapeRegExp(targetOption.offsetLabel)}\\)$`
    );
    const option = await screen.findByRole("option", { name: optionName });
    fireEvent.click(option);

    await waitFor(() => {
      expect(setTimezone).toHaveBeenCalledWith(TARGET_TIMEZONE);
    });
  });
});
