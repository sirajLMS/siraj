import { describe, expect, test } from "bun:test";
import {
  getForceActivateDisabledTooltip,
  getStopDisabledTooltip,
} from "@/frontend/common/views/dashboard/classes/details/admin/adminActionTooltips";

const forceActivateTooltips = {
  activated: "You cannot force activate because this class is already activated.",
  running: "You cannot force activate because the session is running.",
  completed: "You cannot force activate because this class is completed.",
};

const stopTooltips = {
  notActivated: "You cannot stop because this class has not been activated yet.",
  activated: "You cannot stop because the session has not started. Start the session first.",
  completed: "You cannot stop because this class is completed.",
};

describe("adminActionTooltips", () => {
  test("getForceActivateDisabledTooltip returns null for NOT_ACTIVATED", () => {
    expect(getForceActivateDisabledTooltip("NOT_ACTIVATED", forceActivateTooltips)).toBeNull();
  });

  test("getForceActivateDisabledTooltip returns state-specific messages", () => {
    expect(getForceActivateDisabledTooltip("ACTIVATED", forceActivateTooltips)).toBe(forceActivateTooltips.activated);
    expect(getForceActivateDisabledTooltip("RUNNING", forceActivateTooltips)).toBe(forceActivateTooltips.running);
    expect(getForceActivateDisabledTooltip("COMPLETED", forceActivateTooltips)).toBe(forceActivateTooltips.completed);
  });

  test("getStopDisabledTooltip returns null for RUNNING", () => {
    expect(getStopDisabledTooltip("RUNNING", stopTooltips)).toBeNull();
  });

  test("getStopDisabledTooltip returns state-specific messages", () => {
    expect(getStopDisabledTooltip("NOT_ACTIVATED", stopTooltips)).toBe(stopTooltips.notActivated);
    expect(getStopDisabledTooltip("ACTIVATED", stopTooltips)).toBe(stopTooltips.activated);
    expect(getStopDisabledTooltip("COMPLETED", stopTooltips)).toBe(stopTooltips.completed);
  });
});
