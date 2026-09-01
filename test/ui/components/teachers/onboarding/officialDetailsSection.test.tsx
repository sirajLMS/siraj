import { afterEach, describe, expect, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation();

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import type { ComponentType } from "react";
import { type Control, useForm, useWatch } from "react-hook-form";
import type { CountrySelectProps } from "@/frontend/common/components/ui/input/countrySelect/types";
import { getCountryByCode } from "@/frontend/common/lib/locale";
import { OfficialDetailsSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/OfficialDetailsSection";
import type { TeacherOnboardingFormData } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";
import { type AppLocale, locales } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import type { NamespaceHandle } from "@/shared/locale/namespaces/define-namespace";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

// Warm the country-select namespace so the default slot's internal
// `useAppTranslation` resolves synchronously (no Suspense).
const pendingNamespaces: Promise<unknown>[] = [];
const warmHandles: readonly NamespaceHandle<unknown>[] = [Translation.Ui.CountrySelect];
for (const handle of warmHandles) {
  for (const warmLocale of locales) {
    try {
      readTranslation(handle, warmLocale);
    } catch (thrown) {
      if (thrown instanceof Promise) {
        pendingNamespaces.push(thrown);
      }
    }
  }
}
await Promise.all(pendingNamespaces);

const locale: AppLocale = "ar";

const fieldLabels = { fields: { country: "Country" } };

const DESKTOP_SLOT_TEST_ID = "country-select-desktop-slot";
const MOBILE_SLOT_TEST_ID = "country-select-mobile-slot";
const STUB_SLOT_TEST_ID = "country-select-slot-stub";
const ECHO_TEST_ID = "country-code-echo";

function DesktopCountrySelectMarker() {
  return <span data-testid={DESKTOP_SLOT_TEST_ID} />;
}

function MobileCountrySelectMarker() {
  return <span data-testid={MOBILE_SLOT_TEST_ID} />;
}

function CountrySelectionStub({ label, setCountryAction }: CountrySelectProps) {
  return (
    <button
      type="button"
      data-testid={STUB_SLOT_TEST_ID}
      onClick={() => setCountryAction(getCountryByCode("SA") ?? null)}
    >
      {label}
    </button>
  );
}

function CountryCodeEcho({ control }: { readonly control: Control<TeacherOnboardingFormData> }) {
  const countryCode = useWatch({ control, name: "countryCode" });
  return <output data-testid={ECHO_TEST_ID}>{countryCode}</output>;
}

interface OfficialDetailsHarnessProps {
  readonly CountrySelectComponent?: ComponentType<CountrySelectProps>;
}

function OfficialDetailsHarness({ CountrySelectComponent }: OfficialDetailsHarnessProps) {
  const { register, control, formState } = useForm<TeacherOnboardingFormData>();
  return (
    <>
      <OfficialDetailsSection
        register={register}
        control={control}
        errors={formState.errors}
        labels={fieldLabels}
        CountrySelectComponent={CountrySelectComponent}
      />
      <CountryCodeEcho control={control} />
    </>
  );
}

afterEach(() => {
  cleanup();
});

describe("OfficialDetailsSection CountrySelectComponent slot", () => {
  test("falls back to the viewport-agnostic CountrySelect when no slot is injected", () => {
    renderWithWrapper(<OfficialDetailsHarness />, { locale });

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.queryByTestId(DESKTOP_SLOT_TEST_ID)).toBeNull();
    expect(screen.queryByTestId(MOBILE_SLOT_TEST_ID)).toBeNull();
  });

  test("renders the injected desktop country select slot", () => {
    renderWithWrapper(<OfficialDetailsHarness CountrySelectComponent={DesktopCountrySelectMarker} />, { locale });

    expect(screen.getByTestId(DESKTOP_SLOT_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  test("renders the injected mobile country select slot", () => {
    renderWithWrapper(<OfficialDetailsHarness CountrySelectComponent={MobileCountrySelectMarker} />, { locale });

    expect(screen.getByTestId(MOBILE_SLOT_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  test("still writes the selected country into the RHF countryCode field", () => {
    const saudiArabia = getCountryByCode("SA");
    if (!saudiArabia) {
      throw new Error("SA country fixture is missing from the locale country list");
    }

    renderWithWrapper(<OfficialDetailsHarness CountrySelectComponent={CountrySelectionStub} />, { locale });

    expect(screen.getByTestId(ECHO_TEST_ID)).toHaveTextContent("");

    fireEvent.click(screen.getByTestId(STUB_SLOT_TEST_ID));

    expect(screen.getByTestId(ECHO_TEST_ID)).toHaveTextContent(saudiArabia.code.toString());
  });
});
