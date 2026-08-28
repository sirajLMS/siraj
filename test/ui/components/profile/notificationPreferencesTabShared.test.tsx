import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { NotificationPreferencesTabShared } from "@/frontend/common/views/dashboard/profile/core/notifications/__shared__/notificationPreferencesTabShared";
import type { NotificationPreferencesTabVariantProps } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Profile.Notifications, locale);

afterEach(() => {
  cleanup();
});

function renderShared(overrides?: Readonly<Partial<NotificationPreferencesTabVariantProps>>) {
  const variantProps: NotificationPreferencesTabVariantProps = {
    labels,
    preferences: [],
    onToggle: () => {},
    disabled: false,
    loading: false,
    snackbarOpen: false,
    snackbarMessage: "",
    snackbarSeverity: "success",
    onSnackbarClose: () => {},
    errorLoading: false,
    ...overrides,
  };
  return render(<NotificationPreferencesTabShared variantProps={variantProps} options={{ renderBody: () => null }} />, {
    wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
}

describe("NotificationPreferencesTabShared", () => {
  test("renders the section title and description", () => {
    renderShared();
    expect(screen.getByText(labels.title)).toBeInTheDocument();
    expect(screen.getByText(labels.description)).toBeInTheDocument();
  });

  test("shows a success message via AppSnackbar with the ViewModel severity", () => {
    renderShared({ snackbarOpen: true, snackbarMessage: labels.saved, snackbarSeverity: "success" });
    const alert = screen.getByRole("alert");
    expect(alert.className.includes("MuiAlert-colorSuccess")).toBe(true);
    expect(alert.className.includes("MuiAlert-filled")).toBe(true);
    expect(alert.textContent?.includes(labels.saved)).toBe(true);
  });

  test("shows an error message via AppSnackbar with the ViewModel severity", () => {
    renderShared({ snackbarOpen: true, snackbarMessage: labels.errorSaving, snackbarSeverity: "error" });
    const alert = screen.getByRole("alert");
    expect(alert.className.includes("MuiAlert-colorError")).toBe(true);
    expect(alert.className.includes("MuiAlert-filled")).toBe(true);
    expect(alert.textContent?.includes(labels.errorSaving)).toBe(true);
  });

  test("invokes onSnackbarClose when the snackbar close button is clicked", () => {
    let closeCalls = 0;
    renderShared({
      snackbarOpen: true,
      snackbarMessage: labels.saved,
      snackbarSeverity: "success",
      onSnackbarClose: () => {
        closeCalls += 1;
      },
    });
    const closeButton = screen.getByRole("button");
    fireEvent.click(closeButton);
    expect(closeCalls).toBe(1);
  });

  test("shows no snackbar message while it is closed", () => {
    renderShared({ snackbarOpen: false, snackbarMessage: labels.saved, snackbarSeverity: "success" });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("renders the loading error instead of the body when errorLoading", () => {
    renderShared({ errorLoading: true });
    expect(screen.getByText(labels.errorLoading)).toBeInTheDocument();
    expect(screen.getByText(labels.errorLoading).className.includes("MuiTypography-root")).toBe(true);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
