import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation();

import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup } from "@testing-library/react";

expect.extend(matchers);

import { Gender } from "@/frontend/common/graphql/generated/gql/graphql";
import { useTeacherAvailabilityStore } from "@/frontend/common/stores/teacherAvailabilityStore";
import type { AvailabilitySearchFormData } from "@/frontend/common/views/dashboard/teachers/availability/types";
import {
  type TeacherAvailabilityViewModel,
  type UseTeacherAvailabilityViewModelProps,
  useTeacherAvailabilityViewModel,
} from "@/frontend/common/views/dashboard/teachers/availability/useTeacherAvailabilityViewModel";
import { type AppLocale, locales } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

// Warm the availability namespace so `useAppTranslation` resolves synchronously.
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

let capturedViewModel: TeacherAvailabilityViewModel | null = null;

function ViewModelProbe(props: UseTeacherAvailabilityViewModelProps) {
  capturedViewModel = useTeacherAvailabilityViewModel(props);
  return null;
}

function buildProbeProps(overrides: Partial<UseTeacherAvailabilityViewModelProps> = {}) {
  const props: UseTeacherAvailabilityViewModelProps = {
    availability: {},
    insights: { peakLoad: "", availableStaff: 0, timezones: [] },
    defaultFilters: { fromTime: null, toTime: null, gender: null },
    loading: false,
    ...overrides,
  };
  return props;
}

function readViewModel(): TeacherAvailabilityViewModel {
  if (!capturedViewModel) throw new Error("ViewModel probe did not render");
  return capturedViewModel;
}

afterEach(() => {
  cleanup();
  capturedViewModel = null;
  useTeacherAvailabilityStore.getState().reset();
});

describe("useTeacherAvailabilityViewModel", () => {
  test("seeds the search form from the provided defaults when the store holds no draft", () => {
    const defaultFrom = new Date("2026-01-05T08:00:00.000Z");
    const defaultTo = new Date("2026-01-05T17:00:00.000Z");

    renderWithWrapper(
      <ViewModelProbe
        {...buildProbeProps({ defaultFilters: { fromTime: defaultFrom, toTime: defaultTo, gender: Gender.Male } })}
      />,
      { locale }
    );

    const viewModel = readViewModel();
    expect(viewModel.formMethods.getValues("fromTime")?.getTime()).toBe(defaultFrom.getTime());
    expect(viewModel.formMethods.getValues("toTime")?.getTime()).toBe(defaultTo.getTime());
    expect(viewModel.formMethods.getValues("gender")).toBe(Gender.Male);
  });

  test("restores the store draft filters over the provided defaults", () => {
    const draftFrom = new Date("2026-01-05T09:00:00.000Z");
    useTeacherAvailabilityStore.getState().setSearchFilters({
      fromTime: draftFrom,
      toTime: null,
      gender: Gender.Female,
    });

    renderWithWrapper(
      <ViewModelProbe
        {...buildProbeProps({
          defaultFilters: { fromTime: new Date("2026-01-05T08:00:00.000Z"), toTime: null, gender: Gender.Male },
        })}
      />,
      { locale }
    );

    const viewModel = readViewModel();
    expect(viewModel.formMethods.getValues("fromTime")?.getTime()).toBe(draftFrom.getTime());
    expect(viewModel.formMethods.getValues("gender")).toBe(Gender.Female);
  });

  test("handleSubmit dispatches the current form values through onSearch", async () => {
    const onSearch = mock((_data: AvailabilitySearchFormData) => undefined);

    renderWithWrapper(
      <ViewModelProbe
        {...buildProbeProps({
          defaultFilters: { fromTime: null, toTime: null, gender: Gender.Male },
          onSearch,
        })}
      />,
      { locale }
    );

    const viewModel = readViewModel();
    await act(async () => {
      await viewModel.formMethods.handleSubmit(data => {
        viewModel.onSearch?.(data);
      })();
    });

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch.mock.calls[0]?.[0]).toEqual({ fromTime: null, toTime: null, gender: Gender.Male });
  });
});
