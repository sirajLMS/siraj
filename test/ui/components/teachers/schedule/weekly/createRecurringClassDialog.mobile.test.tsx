import { afterEach, describe, expect, mock, test } from "bun:test";
import type { TimezoneSelectProps } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

const dialogLocale: AppLocale = "ar";

await mockNextNavigation("/teachers", { locale: dialogLocale });

const TEACHER_ID = "teacher-1";
const INITIAL_TIMEZONE = IanaTimezone.Africa_Cairo;
const TARGET_TIMEZONE = IanaTimezone.Europe_London;

// Record every render of the mobile-tier timezone primitive so tests can assert
// the dialog wires the `TimezoneSelect` slot to `TimezoneSelectMobile` (not the
// viewport-agnostic common `TimezoneSelect`). The stub also exposes change/clear
// triggers so tests can drive `onChangeAction` without opening the real
// autocomplete popup. (The real component must not be re-imported from inside
// this module-mock factory: awaiting it here deadlocks `bun test`.)
const renderedTimezoneSelectProps: TimezoneSelectProps[] = [];

await mock.module("@/frontend/mobile/components/ui/input/timezoneSelect", () => {
  const StubTimezoneSelectMobile = (props: Readonly<TimezoneSelectProps>) => {
    renderedTimezoneSelectProps.push(props);
    return (
      <div data-testid="timezone-select-mobile-stub">
        <output data-testid="timezone-select-value">{props.value ?? ""}</output>
        <span data-testid="timezone-select-label">{props.label ?? ""}</span>
        <button
          type="button"
          data-testid="timezone-select-change"
          onClick={() => props.onChangeAction(TARGET_TIMEZONE)}
        >
          stub-change
        </button>
        <button type="button" data-testid="timezone-select-clear" onClick={() => props.onChangeAction(null)}>
          stub-clear
        </button>
      </div>
    );
  };
  return { TimezoneSelectMobile: StubTimezoneSelectMobile };
});

import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import type { Dispatch, SetStateAction } from "react";
import { USER_SELECT_LIMIT } from "@/frontend/common/components/ui/input/userSelect/userSelect.constants";
import { ClassType } from "@/frontend/common/graphql/generated/gql/graphql";
import { studentsQueryDocument, userMeetingConfigsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import type { RecurringMeetingConfigValidation } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { emptyRecurringMeetingConfigState } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import type { CreateRecurringClassDialogFormState } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type { CreateRecurringClassDialogViewModel } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { CreateRecurringClassDialogMobile } from "@/frontend/mobile/views/dashboard/teachers/schedule/weekly/components/createRecurringClassDialog.mobile";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

const dialogLabels = readTranslation(Translation.Dashboard.TeacherCreateRecurringClass, dialogLocale);
const commonLabels = readTranslation(Translation.Common, dialogLocale);
const meetingLabels = readTranslation(Translation.Ui.MeetingConfig, dialogLocale).manager;
const recurringScheduleLabels = readTranslation(Translation.Ui.MeetingConfigRecurringSchedule, dialogLocale);

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
  setTimezone: CreateRecurringClassDialogFormState["setTimezone"],
  closeDialog: CreateRecurringClassDialogViewModel["closeDialog"] = () => {}
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
    closeDialog,
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

function renderMobileDialog(
  setTimezone: CreateRecurringClassDialogFormState["setTimezone"] = () => {},
  closeDialog: CreateRecurringClassDialogViewModel["closeDialog"] = () => {}
) {
  renderedTimezoneSelectProps.length = 0;
  return renderWithWrapper(
    <CreateRecurringClassDialogMobile teacherId={TEACHER_ID} viewModel={makeViewModel(setTimezone, closeDialog)} />,
    { locale: dialogLocale, mocks: apolloMocks, viewport: "mobile" }
  );
}

afterEach(() => {
  cleanup();
});

describe("CreateRecurringClassDialogMobile timezone slot", () => {
  test("renders the timezone field through TimezoneSelectMobile with the translated label and current IANA value", () => {
    renderMobileDialog();

    expect(screen.getByTestId("timezone-select-mobile-stub")).toBeVisible();
    expect(screen.getByTestId("timezone-select-value").textContent).toBe(INITIAL_TIMEZONE);
    expect(screen.getByTestId("timezone-select-label").textContent).toBe(dialogLabels.fields.timezone);

    const slotProps = renderedTimezoneSelectProps.at(-1);
    expect(slotProps).toBeDefined();
    expect(slotProps?.label).toBe(dialogLabels.fields.timezone);
    expect(slotProps?.value).toBe(INITIAL_TIMEZONE);
    expect(slotProps?.fullWidth).toBe(true);
    expect(slotProps?.disabled).toBe(false);
  });

  test("propagates the chosen IANA timezone to the form state and ignores null clears", async () => {
    const setTimezone = mock<Dispatch<SetStateAction<IanaTimezone>>>(() => {});
    renderMobileDialog(setTimezone);

    fireEvent.click(screen.getByTestId("timezone-select-change"));

    await waitFor(() => {
      expect(setTimezone).toHaveBeenCalledWith(TARGET_TIMEZONE);
    });

    fireEvent.click(screen.getByTestId("timezone-select-clear"));
    expect(setTimezone).toHaveBeenCalledTimes(1);
  });
});

describe("CreateRecurringClassDialogMobile shell", () => {
  test("renders the mobile app bar with the translated close control that closes the dialog", () => {
    const closeDialog = mock(() => {});
    renderMobileDialog(() => {}, closeDialog);

    const closeButton = screen.getByRole("button", { name: commonLabels.ariaClose });
    expect(closeButton).toBeVisible();

    fireEvent.click(closeButton);
    expect(closeDialog).toHaveBeenCalledTimes(1);
  });
});
