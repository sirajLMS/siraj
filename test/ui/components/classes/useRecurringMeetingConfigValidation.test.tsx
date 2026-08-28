import { afterEach, describe, expect, test } from "bun:test";
import { act, cleanup, render } from "@testing-library/react";
import { useEffect } from "react";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { RecurringMeetingConfigValidation } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { useRecurringMeetingConfigValidation } from "@/frontend/common/views/dashboard/classes/recurring/useRecurringMeetingConfigValidation";
import type { RecurringMeetingConfigFormState } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const meetingConfigLabels = readTranslation(Translation.Ui.MeetingConfig, locale);

const ZOOM_PROVIDER: MeetingProviderFieldsFragment = {
  id: "provider-zoom",
  slug: "zoom",
  name: { ar: "Zoom", en: "Zoom" },
  description: null,
  instructions: null,
  urlAllowlist: ["zoom.us"],
  urlExample: "https://zoom.us/j/123456789",
  logoUrl: null,
  providerKind: "zoom",
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  fieldSchema: {
    requiresMeetingUrl: true,
    supportsAutoGeneration: false,
    supportsUsername: false,
    supportsPassword: true,
    supportsTenantId: false,
  },
};

function makeState(overrides: Partial<RecurringMeetingConfigFormState>): RecurringMeetingConfigFormState {
  return {
    useTeacherDefault: false,
    selectedConfig: null,
    newProvider: null,
    newMeetingUrl: "",
    newLabel: "",
    ...overrides,
  };
}

let latestValidation: RecurringMeetingConfigValidation | null = null;

// renderHook is unavailable in bun:test — capture the hook result via a probe
// component and drive validation inside act().
function ValidationProbe({ value }: { readonly value: RecurringMeetingConfigFormState }) {
  const validation = useRecurringMeetingConfigValidation(value);
  useEffect(() => {
    latestValidation = validation;
  });
  return <div data-testid="probe" />;
}

function renderProbe(value: RecurringMeetingConfigFormState) {
  return render(<ValidationProbe value={value} />, {
    wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
}

/** Runs the lifted URL validator against the latest hook snapshot in act(). */
function runValidateUrl(): boolean | undefined {
  const validation = latestValidation;
  let valid: boolean | undefined;
  act(() => {
    valid = validation?.onValidateUrl();
  });
  return valid;
}

function expectNoErrors() {
  expect(latestValidation?.urlError).toBeNull();
  expect(latestValidation?.fieldsError).toBeNull();
}

describe("useRecurringMeetingConfigValidation", () => {
  afterEach(() => {
    cleanup();
    latestValidation = null;
  });

  test("incomplete config surfaces fieldsError with recurringFieldsRequired and no urlError", () => {
    renderProbe(makeState({}));

    expect(runValidateUrl()).toBe(false);
    expect(latestValidation?.fieldsError).toBe(meetingConfigLabels.classScope.recurringFieldsRequired);
    expect(latestValidation?.urlError).toBeNull();
  });

  test("urlNotAllowed surfaces urlError with the localized message and no fieldsError", () => {
    renderProbe(makeState({ newProvider: ZOOM_PROVIDER, newMeetingUrl: "https://evil.example.com/meet" }));

    expect(runValidateUrl()).toBe(false);
    expect(latestValidation?.urlError).toBe(meetingConfigLabels.manager.urlNotAllowed);
    expect(latestValidation?.fieldsError).toBeNull();
  });

  test("allowed URL passes validation and clears errors", () => {
    renderProbe(makeState({ newProvider: ZOOM_PROVIDER, newMeetingUrl: "https://zoom.us/j/123456789" }));

    expect(runValidateUrl()).toBe(true);
    expectNoErrors();
  });

  test("teacher-default mode is valid and clears surfaced errors", () => {
    renderProbe(makeState({ useTeacherDefault: true }));

    expect(runValidateUrl()).toBe(true);
    expectNoErrors();
  });

  test("resetErrors clears previously surfaced errors", () => {
    renderProbe(makeState({ newProvider: ZOOM_PROVIDER, newMeetingUrl: "https://evil.example.com/meet" }));

    expect(runValidateUrl()).toBe(false);
    expect(latestValidation?.urlError).toBe(meetingConfigLabels.manager.urlNotAllowed);

    act(() => {
      latestValidation?.resetErrors();
    });

    expectNoErrors();
  });
});
