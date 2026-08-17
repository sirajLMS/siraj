import { describe, expect, test } from "bun:test";
import {
  getForceActivateDisabledTooltip,
  getStopDisabledTooltip,
} from "@/frontend/common/views/dashboard/classes/details/admin/adminActionTooltips";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

const locale: AppLocale = "ar";
const adminActions = readTranslation(Translation.Dashboard.AdminView, locale).adminActions;
const forceActivateTooltips = adminActions.disabledTooltips.forceActivate;
const stopTooltips = adminActions.disabledTooltips.stop;

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
