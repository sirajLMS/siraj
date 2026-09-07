import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, render } from "@testing-library/react";
import { useAppearanceLivePreview } from "@/frontend/common/hooks/useAppearanceLivePreview";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";

expect.extend(matchers);

function TestComponent() {
  useAppearanceLivePreview();
  return null;
}

describe("useAppearanceLivePreview", () => {
  let brandLogoEl: HTMLDivElement;
  let brandNameEl: HTMLDivElement;
  let metaDescEl: HTMLMetaElement;

  beforeEach(() => {
    document.title = "Original Title";

    metaDescEl = document.createElement("meta");
    metaDescEl.name = "description";
    metaDescEl.content = "Original Description";
    document.head.appendChild(metaDescEl);

    brandNameEl = document.createElement("div");
    brandNameEl.setAttribute("data-appearance-target", "brand-name");
    brandNameEl.textContent = "Original Brand Name";
    document.body.appendChild(brandNameEl);

    brandLogoEl = document.createElement("div");
    brandLogoEl.setAttribute("data-appearance-target", "brand-logo");
    brandLogoEl.innerHTML = '<svg data-testid="default-logo"></svg>';
    document.body.appendChild(brandLogoEl);

    useAppearancePreviewStore.getState().resetToDefaults();
    useAppearancePreviewStore.setState({ lastPublished: null });
  });

  afterEach(() => {
    cleanup();
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    useAppearancePreviewStore.getState().resetToDefaults();
  });

  test("safely renders logo image element when logoUrl is provided", () => {
    act(() => {
      useAppearancePreviewStore.setState({
        isCustomizeMode: true,
        draft: {
          ...useAppearancePreviewStore.getState().draft,
          logoUrl: "https://example.com/logo.png",
        },
      });
    });

    render(<TestComponent />);

    const img = brandLogoEl.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://example.com/logo.png");
    expect(img?.alt).toBe("Site logo");
    expect(img?.style.width).toBe("24px");
    expect(img?.style.height).toBe("24px");
  });

  test("prevents XSS when logoUrl contains malicious HTML payload", () => {
    const maliciousPayload = '"><img src=x onerror=alert(1)>';
    act(() => {
      useAppearancePreviewStore.setState({
        isCustomizeMode: true,
        draft: {
          ...useAppearancePreviewStore.getState().draft,
          logoUrl: maliciousPayload,
        },
      });
    });

    render(<TestComponent />);

    // Exactly 1 img tag created safely by DOM API
    const imgList = brandLogoEl.querySelectorAll("img");
    expect(imgList).toHaveLength(1);
    expect(imgList[0].getAttribute("src")).toBe(maliciousPayload);
    // Ensure no additional HTML elements or unescaped tags were injected
    expect(brandLogoEl.children).toHaveLength(1);
  });

  test("restores original icon markup when logoUrl is null or customize mode exits", () => {
    act(() => {
      useAppearancePreviewStore.setState({
        isCustomizeMode: true,
        draft: {
          ...useAppearancePreviewStore.getState().draft,
          logoUrl: "https://example.com/logo.png",
        },
      });
    });

    const { rerender } = render(<TestComponent />);

    expect(brandLogoEl.querySelector("img")).not.toBeNull();

    // Set logoUrl back to null while customize mode is active
    act(() => {
      useAppearancePreviewStore.setState({
        draft: {
          ...useAppearancePreviewStore.getState().draft,
          logoUrl: null,
        },
      });
    });
    rerender(<TestComponent />);

    expect(brandLogoEl.querySelector('[data-testid="default-logo"]')).not.toBeNull();
  });

  test("exit without a publish restores the DOM values captured at entry", () => {
    act(() => {
      useAppearancePreviewStore.setState({
        isCustomizeMode: true,
        draft: {
          ...useAppearancePreviewStore.getState().draft,
          siteName: "Draft Name",
          siteTitle: "Draft Title",
        },
      });
    });

    render(<TestComponent />);
    expect(brandNameEl.textContent).toBe("Draft Name");
    expect(document.title).toBe("Draft Title");

    act(() => {
      useAppearancePreviewStore.setState({ isCustomizeMode: false });
    });

    expect(brandNameEl.textContent).toBe("Original Brand Name");
    expect(document.title).toBe("Original Title");
    expect(metaDescEl.content).toBe("Original Description");
  });

  test("exit after a publish restores the just-published values, not the entry captures", () => {
    act(() => {
      useAppearancePreviewStore.setState({
        isCustomizeMode: true,
        draft: {
          ...useAppearancePreviewStore.getState().draft,
          siteName: "Draft Name",
          siteTitle: "Draft Title",
        },
      });
    });

    render(<TestComponent />);
    expect(brandNameEl.textContent).toBe("Draft Name");

    act(() => {
      useAppearancePreviewStore.getState().markPublished({
        ...useAppearancePreviewStore.getState().draft,
        siteName: "Published Name",
        siteTitle: "Published Title",
        siteDescription: "Published Description",
        logoUrl: null,
      });
      useAppearancePreviewStore.setState({ isCustomizeMode: false });
    });

    expect(brandNameEl.textContent).toBe("Published Name");
    expect(document.title).toBe("Published Title");
    expect(metaDescEl.content).toBe("Published Description");
  });
});
