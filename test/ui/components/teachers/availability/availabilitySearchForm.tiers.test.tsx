import { afterAll, afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation();

import { Gender } from "@/frontend/common/graphql/generated/gql/graphql";

mock.module("@/frontend/desktop/components/ui/form/time", () => ({
  DesktopAppTimePicker: () => <span data-testid="desktop-time-picker" />,
  DesktopAppTimeRangePicker: () => null,
}));

mock.module("@/frontend/desktop/components/ui/input/genderSelector", () => ({
  GenderSelectorDesktop: ({ setGenderAction }: { readonly setGenderAction: (gender: Gender | null) => void }) => (
    <button type="button" data-testid="gender-desktop" onClick={() => setGenderAction(Gender.Male)}>
      gender-desktop-marker
    </button>
  ),
}));

mock.module("@/frontend/mobile/components/ui/form/time", () => ({
  MobileAppTimePicker: () => <span data-testid="mobile-time-picker" />,
  MobileAppTimeRangePicker: () => null,
}));

mock.module("@/frontend/mobile/components/ui/input/genderSelector", () => ({
  GenderSelectorMobile: () => <span data-testid="gender-mobile" />,
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import type { ComponentType } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { availabilitySearchResolverFactory } from "@/frontend/common/views/dashboard/teachers/availability/schemas/availabilitySearchSchema";
import type {
  AvailabilitySearchFormData,
  AvailabilitySearchFormProps,
} from "@/frontend/common/views/dashboard/teachers/availability/types";
import { AvailabilitySearchFormDesktop } from "@/frontend/desktop/views/dashboard/teachers/availability/components/availabilitySearchForm.desktop";
import { AvailabilitySearchFormMobile } from "@/frontend/mobile/views/dashboard/teachers/availability/components/availabilitySearchForm.mobile";
import { type AppLocale, locales } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

// Warm the availability namespace so the label lookups resolve synchronously.
const pendingNamespaces: Promise<unknown>[] = [];
for (const warmLocale of locales) {
  try {
    readTranslation(Translation.Dashboard.TeacherAvailability, warmLocale);
  } catch (thrown) {
    if (thrown instanceof Promise) {
      pendingNamespaces.push(thrown);
    }
  }
}
await Promise.all(pendingNamespaces);

const locale: AppLocale = "en";
const availabilityLabels = readTranslation(Translation.Dashboard.TeacherAvailability, locale);

const formLabels = {
  searchTitle: availabilityLabels.searchTitle,
  from: availabilityLabels.from,
  to: availabilityLabels.to,
  gender: availabilityLabels.gender,
  any: availabilityLabels.any,
  male: availabilityLabels.male,
  female: availabilityLabels.female,
  submit: availabilityLabels.submit,
};

function TierHarness({
  FormComponent,
  onSearch,
}: {
  readonly FormComponent: ComponentType<AvailabilitySearchFormProps>;
  readonly onSearch: (data: AvailabilitySearchFormData) => void;
}) {
  const methods = useForm<AvailabilitySearchFormData>({
    defaultValues: { fromTime: null, toTime: null, gender: null },
    resolver: availabilitySearchResolverFactory({ invalidGender: availabilityLabels.validation.invalidGender }),
  });
  return (
    <FormProvider {...methods}>
      <FormComponent onSearch={onSearch} labels={formLabels} />
    </FormProvider>
  );
}

afterEach(() => {
  cleanup();
});

afterAll(() => {
  // Restore the tier module mocks so they do not bleed into later test files.
  mock.restore();
});

describe("AvailabilitySearchForm tier wiring", () => {
  test("desktop form renders the desktop time picker and gender selector variants", () => {
    renderWithWrapper(<TierHarness FormComponent={AvailabilitySearchFormDesktop} onSearch={() => {}} />, { locale });

    expect(screen.getAllByTestId("desktop-time-picker")).toHaveLength(2);
    expect(screen.getByTestId("gender-desktop")).toBeInTheDocument();
    expect(screen.queryByTestId("mobile-time-picker")).not.toBeInTheDocument();
    expect(screen.queryByTestId("gender-mobile")).not.toBeInTheDocument();
  });

  test("mobile form renders the mobile time picker and gender selector variants", () => {
    renderWithWrapper(<TierHarness FormComponent={AvailabilitySearchFormMobile} onSearch={() => {}} />, {
      locale,
      viewport: "mobile",
    });

    expect(screen.getAllByTestId("mobile-time-picker")).toHaveLength(2);
    expect(screen.getByTestId("gender-mobile")).toBeInTheDocument();
    expect(screen.queryByTestId("desktop-time-picker")).not.toBeInTheDocument();
    expect(screen.queryByTestId("gender-desktop")).not.toBeInTheDocument();
  });

  test("submitting the desktop form forwards the tier selector value to onSearch", async () => {
    const onSearch = mock((_data: AvailabilitySearchFormData) => undefined);

    renderWithWrapper(<TierHarness FormComponent={AvailabilitySearchFormDesktop} onSearch={onSearch} />, { locale });

    fireEvent.click(screen.getByTestId("gender-desktop"));
    fireEvent.click(screen.getByRole("button", { name: formLabels.submit }));

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    const submitted = onSearch.mock.calls[0]?.[0];
    expect(submitted?.gender).toBe(Gender.Male);
  });
});
