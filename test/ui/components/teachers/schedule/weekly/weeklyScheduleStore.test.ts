import { beforeEach, describe, expect, test } from "bun:test";
import { useWeeklyScheduleStore } from "@/frontend/common/stores/weeklyScheduleStore";

beforeEach(() => {
  useWeeklyScheduleStore.setState({
    selectedWeekDate: "",
    clearDialogOpen: false,
    deleteConfirmClassInstanceId: null,
    selectedDay: "monday",
  });
});

describe("useWeeklyScheduleStore per-item delete confirmation", () => {
  test("defaults to no open dialog", () => {
    expect(useWeeklyScheduleStore.getState().deleteConfirmClassInstanceId).toBeNull();
  });

  test("openDeleteConfirm stores the class instance id", () => {
    useWeeklyScheduleStore.getState().openDeleteConfirm("class-42");
    expect(useWeeklyScheduleStore.getState().deleteConfirmClassInstanceId).toBe("class-42");
  });

  test("closeDeleteConfirm clears the open dialog", () => {
    useWeeklyScheduleStore.getState().openDeleteConfirm("class-42");
    useWeeklyScheduleStore.getState().closeDeleteConfirm();
    expect(useWeeklyScheduleStore.getState().deleteConfirmClassInstanceId).toBeNull();
  });

  test("confirmDeleteClassInstance returns the confirmed id and clears the dialog", () => {
    useWeeklyScheduleStore.getState().openDeleteConfirm("class-42");
    const confirmedId = useWeeklyScheduleStore.getState().confirmDeleteClassInstance();
    expect(confirmedId).toBe("class-42");
    expect(useWeeklyScheduleStore.getState().deleteConfirmClassInstanceId).toBeNull();
  });

  test("confirmDeleteClassInstance returns null when no dialog is open", () => {
    expect(useWeeklyScheduleStore.getState().confirmDeleteClassInstance()).toBeNull();
  });

  test("per-item delete dialog is independent of the clear-whole-schedule dialog", () => {
    useWeeklyScheduleStore.getState().setClearDialogOpen(true);
    useWeeklyScheduleStore.getState().openDeleteConfirm("class-42");
    expect(useWeeklyScheduleStore.getState().clearDialogOpen).toBe(true);
    expect(useWeeklyScheduleStore.getState().deleteConfirmClassInstanceId).toBe("class-42");

    useWeeklyScheduleStore.getState().confirmDeleteClassInstance();
    expect(useWeeklyScheduleStore.getState().clearDialogOpen).toBe(true);
  });
});

describe("useWeeklyScheduleStore selectedDay filter", () => {
  test("defaults to monday", () => {
    expect(useWeeklyScheduleStore.getState().selectedDay).toBe("monday");
  });

  test("setSelectedDay updates the selected day", () => {
    useWeeklyScheduleStore.getState().setSelectedDay("wednesday");
    expect(useWeeklyScheduleStore.getState().selectedDay).toBe("wednesday");
  });
});
