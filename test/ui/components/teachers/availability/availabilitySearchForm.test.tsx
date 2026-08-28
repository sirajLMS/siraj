import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation();

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { type ComponentType, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Gender } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  availabilitySearchResolverFactory,
  availabilitySearchSchemaFactory,
} from "@/frontend/common/views/dashboard/teachers/availability/schemas/availabilitySearchSchema";
import type {
  AvailabilitySearchFormData,
  AvailabilitySearchFormProps,
} from "@/frontend/common/views/dashboard/teachers/availability/types";
import { AvailabilitySearchFormDesktop } from "@/frontend/desktop/views/dashboard/teachers/availability/components/availabilitySearchForm.desktop";
import { AvailabilitySearchFormMobile } from "@/frontend/mobile/views/dashboard/teachers/availability/components/availabilitySearchForm.mobile";
import { type AppLocale, locales } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import type { NamespaceHandle } from "@/shared/locale/namespaces/define-namespace";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

// Warm the availability + gender selector namespaces so `readTranslation` and
// the selector's internal `useAppTranslation` resolve synchronously (no Suspense).
const pendingNamespaces: Promise<unknown>[] = [];
const warmHandles: readonly NamespaceHandle<unknown>[] = [
  Translation.Dashboard.TeacherAvailability,
  Translation.Ui.GenderSelector,
];
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

interface HarnessProps {
  readonly FormComponent: ComponentType<AvailabilitySearchFormProps>;
  readonly onSearch: (data: AvailabilitySearchFormData) => void;
  readonly seedGenderError?: boolean;
}

function AvailabilitySearchHarness({ FormComponent, onSearch, seedGenderError = false }: HarnessProps) {
  const methods = useForm<AvailabilitySearchFormData>({
    defaultValues: { fromTime: null, toTime: null, gender: null },
    resolver: availabilitySearchResolverFactory({ invalidGender: availabilityLabels.validation.invalidGender }),
  });
  const { setError } = methods;

  useEffect(() => {
    if (seedGenderError) {
      setError("gender", { type: "validate", message: availabilityLabels.validation.invalidGender });
    }
  }, [seedGenderError, setError]);

  return (
    <FormProvider {...methods}>
      <FormComponent onSearch={onSearch} labels={formLabels} />
    </FormProvider>
  );
}

afterEach(() => {
  cleanup();
});

describe("AvailabilitySearchForm", () => {
  test("renders translated field labels and the translated submit action", () => {
    renderWithWrapper(<AvailabilitySearchHarness FormComponent={AvailabilitySearchFormDesktop} onSearch={() => {}} />, {
      locale,
    });

    expect(screen.getAllByText(formLabels.from).length).toBeGreaterThan(0);
    expect(screen.getAllByText(formLabels.to).length).toBeGreaterThan(0);
    expect(screen.getByText(formLabels.gender)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: formLabels.any })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: formLabels.male })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: formLabels.female })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: formLabels.submit })).toBeInTheDocument();
  });

  test("submitting forwards the selected gender and time values to onSearch", async () => {
    const onSearch = mock((_data: AvailabilitySearchFormData) => undefined);

    renderWithWrapper(<AvailabilitySearchHarness FormComponent={AvailabilitySearchFormDesktop} onSearch={onSearch} />, {
      locale,
    });

    fireEvent.click(screen.getByRole("button", { name: formLabels.male }));
    fireEvent.click(screen.getByRole("button", { name: formLabels.submit }));

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    const submitted = onSearch.mock.calls[0]?.[0];
    expect(submitted?.gender).toBe(Gender.Male);
    expect(submitted?.fromTime).toBeNull();
    expect(submitted?.toTime).toBeNull();
  });

  test("surfaces the translated validation message when the gender field is invalid", async () => {
    renderWithWrapper(
      <AvailabilitySearchHarness FormComponent={AvailabilitySearchFormDesktop} onSearch={() => {}} seedGenderError />,
      { locale }
    );

    await waitFor(() => expect(screen.getByText(availabilityLabels.validation.invalidGender)).toBeInTheDocument());
  });

  test("renders the mobile wrapper with the same shared controls", () => {
    renderWithWrapper(<AvailabilitySearchHarness FormComponent={AvailabilitySearchFormMobile} onSearch={() => {}} />, {
      locale,
      viewport: "mobile",
    });

    expect(screen.getByRole("button", { name: formLabels.any })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: formLabels.submit })).toBeInTheDocument();
  });
});

describe("availabilitySearchSchemaFactory", () => {
  const schema = availabilitySearchSchemaFactory({ invalidGender: availabilityLabels.validation.invalidGender });

  test("rejects an invalid gender with the translated validation label", () => {
    const result = schema.safeParse({ fromTime: null, toTime: null, gender: "not-a-gender" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(availabilityLabels.validation.invalidGender);
    }
  });

  test("accepts null and enum gender values", () => {
    for (const gender of [null, Gender.Male, Gender.Female]) {
      expect(schema.safeParse({ fromTime: null, toTime: null, gender }).success).toBe(true);
    }
  });
});
