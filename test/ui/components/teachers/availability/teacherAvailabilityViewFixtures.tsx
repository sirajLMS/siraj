import type { ComponentType } from "react";
import { useForm } from "react-hook-form";
import { DayOfWeek } from "@/frontend/common/graphql/generated/gql/graphql";
import { availabilitySearchResolverFactory } from "@/frontend/common/views/dashboard/teachers/availability/schemas/availabilitySearchSchema";
import type { AvailabilitySearchFormData } from "@/frontend/common/views/dashboard/teachers/availability/types";
import type { TeacherAvailabilityViewModel } from "@/frontend/common/views/dashboard/teachers/availability/useTeacherAvailabilityViewModel";
import { type AppLocale, locales } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import type { NamespaceHandle } from "@/shared/locale/namespaces/define-namespace";
import { Translation } from "@/shared/locale/namespaces/translation";

// Warm the availability + gender selector namespaces so `readTranslation` and
// the search form's internal `useAppTranslation` resolve synchronously (no Suspense).
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

export const AVAILABILITY_TEST_TEACHER = "Test Teacher";

export type TeacherAvailabilityViewFixture = Omit<TeacherAvailabilityViewModel, "formMethods">;

export function buildTeacherAvailabilityViewModel(
  locale: AppLocale,
  overrides: Partial<TeacherAvailabilityViewFixture> = {}
): TeacherAvailabilityViewFixture {
  const t = readTranslation(Translation.Dashboard.TeacherAvailability, locale);
  const { table, ...shell } = t;
  return {
    labelsBySection: { shell, table },
    availability: {
      "09:00": {
        [DayOfWeek.Monday]: [{ id: "slot-1", teacherName: AVAILABILITY_TEST_TEACHER, localTime: "09:00" }],
      },
    },
    insights: { peakLoad: "09:00", availableStaff: 1, timezones: [] },
    defaultFilters: { fromTime: null, toTime: null, gender: null },
    ...overrides,
  };
}

interface TeacherAvailabilityViewHarnessProps {
  readonly locale: AppLocale;
  readonly overrides?: Partial<TeacherAvailabilityViewFixture>;
  readonly ViewPanel: ComponentType<TeacherAvailabilityViewModel>;
}

/**
 * Provides the RHF form instance that the ViewModel hands to tier views, so
 * tier views render from a fully mocked view-model object in isolation.
 */
export function TeacherAvailabilityViewHarness({
  locale,
  overrides,
  ViewPanel,
}: Readonly<TeacherAvailabilityViewHarnessProps>) {
  const viewModel = buildTeacherAvailabilityViewModel(locale, overrides);
  const formMethods = useForm<AvailabilitySearchFormData>({
    defaultValues: viewModel.defaultFilters,
    resolver: availabilitySearchResolverFactory({
      invalidGender: viewModel.labelsBySection.shell.validation.invalidGender,
    }),
  });
  return <ViewPanel {...viewModel} formMethods={formMethods} />;
}
