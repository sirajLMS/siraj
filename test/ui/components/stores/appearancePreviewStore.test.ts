import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";

describe("appearancePreviewStore - enterCustomizeMode color scheme detection", () => {
  const originalDatasetMui = document.documentElement.dataset.muiColorScheme;
  const originalDatasetTheme = document.documentElement.dataset.theme;

  beforeEach(() => {
    delete document.documentElement.dataset.muiColorScheme;
    delete document.documentElement.dataset.theme;
    useAppearancePreviewStore.setState({
      isCustomizeMode: false,
      isDark: true,
    });
  });

  afterEach(() => {
    if (originalDatasetMui !== undefined) {
      document.documentElement.dataset.muiColorScheme = originalDatasetMui;
    } else {
      delete document.documentElement.dataset.muiColorScheme;
    }
    if (originalDatasetTheme !== undefined) {
      document.documentElement.dataset.theme = originalDatasetTheme;
    } else {
      delete document.documentElement.dataset.theme;
    }
    useAppearancePreviewStore.getState().exitCustomizeMode();
  });

  test("detects light mode from data-mui-color-scheme on <html>", () => {
    document.documentElement.dataset.muiColorScheme = "light";

    useAppearancePreviewStore.getState().enterCustomizeMode();

    const state = useAppearancePreviewStore.getState();
    expect(state.isCustomizeMode).toBe(true);
    expect(state.isDark).toBe(false);
  });

  test("detects dark mode from data-mui-color-scheme on <html>", () => {
    document.documentElement.dataset.muiColorScheme = "dark";

    useAppearancePreviewStore.getState().enterCustomizeMode();

    const state = useAppearancePreviewStore.getState();
    expect(state.isCustomizeMode).toBe(true);
    expect(state.isDark).toBe(true);
  });

  test("detects light mode from fallback data-theme on <html> when data-mui-color-scheme is missing", () => {
    document.documentElement.dataset.theme = "light";

    useAppearancePreviewStore.getState().enterCustomizeMode();

    const state = useAppearancePreviewStore.getState();
    expect(state.isCustomizeMode).toBe(true);
    expect(state.isDark).toBe(false);
  });

  test("detects dark mode from fallback data-theme on <html> when data-mui-color-scheme is missing", () => {
    document.documentElement.dataset.theme = "dark";

    useAppearancePreviewStore.getState().enterCustomizeMode();

    const state = useAppearancePreviewStore.getState();
    expect(state.isCustomizeMode).toBe(true);
    expect(state.isDark).toBe(true);
  });

  test("preserves default/current store isDark when no dataset attribute is present", () => {
    useAppearancePreviewStore.setState({ isDark: false });

    useAppearancePreviewStore.getState().enterCustomizeMode();

    const state = useAppearancePreviewStore.getState();
    expect(state.isCustomizeMode).toBe(true);
    expect(state.isDark).toBe(false);
  });
});
