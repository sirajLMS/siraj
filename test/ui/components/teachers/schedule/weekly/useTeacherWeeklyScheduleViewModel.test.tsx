import { afterEach, describe, expect, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation();

import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup } from "@testing-library/react";

expect.extend(matchers);

import { useEffect } from "react";
import { useWeeklyScheduleStore } from "@/frontend/common/stores/weeklyScheduleStore";
import {
  type TeacherWeeklyScheduleViewModel,
  useTeacherWeeklyScheduleViewModel,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/useTeacherWeeklyScheduleViewModel";
import { type AppLocale, locales } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

// Warm the namespaces the ViewModel loads via `useAppTranslation` so they
// resolve synchronously on first render.
const pendingNamespaces: Promise<unknown>[] = [];
function warmNamespace(read: () => unknown): void {
  try {
    read();
  } catch (thrown) {
    if (thrown instanceof Promise) {
      pendingNamespaces.push(thrown);
    }
  }
}
for (const warmLocale of locales) {
  warmNamespace(() => readTranslation(Translation.Dashboard.TeacherWeeklySchedule, warmLocale));
  warmNamespace(() => readTranslation(Translation.Dashboard.TeacherCreateRecurringClass, warmLocale));
  warmNamespace(() => readTranslation(Translation.Ui.MeetingConfig, warmLocale));
  warmNamespace(() => readTranslation(Translation.Ui.MeetingConfigRecurringSchedule, warmLocale));
}
await Promise.all(pendingNamespaces);

const locale: AppLocale = "en";

let capturedViewModel: TeacherWeeklyScheduleViewModel | null = null;

function ViewModelProbe() {
  const viewModel = useTeacherWeeklyScheduleViewModel({ teacherId: "teacher-1" });
  useEffect(() => {
    capturedViewModel = viewModel;
  }, [viewModel]);
  return null;
}

function readViewModel(): TeacherWeeklyScheduleViewModel {
  if (!capturedViewModel) throw new Error("ViewModel probe did not render");
  return capturedViewModel;
}

afterEach(() => {
  cleanup();
  capturedViewModel = null;
  useWeeklyScheduleStore.setState({
    selectedWeekDate: "",
    clearDialogOpen: false,
    deleteConfirmClassInstanceId: null,
    selectedDay: "monday",
  });
});

describe("useTeacherWeeklyScheduleViewModel selectedDay", () => {
  test("selectedDay mirrors the store value", () => {
    useWeeklyScheduleStore.setState({ selectedDay: "wednesday" });

    renderWithWrapper(<ViewModelProbe />, { locale });

    expect(readViewModel().selectedDay).toBe("wednesday");
  });

  test("onSelectDay delegates to the store setter", async () => {
    renderWithWrapper(<ViewModelProbe />, { locale });

    const viewModel = readViewModel();

    await act(async () => {
      viewModel.onSelectDay("friday");
    });

    expect(useWeeklyScheduleStore.getState().selectedDay).toBe("friday");
  });
});
