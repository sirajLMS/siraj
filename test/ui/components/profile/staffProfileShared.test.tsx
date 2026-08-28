import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

expect.extend(matchers);

import { StaffProfileSharedView } from "@/frontend/common/views/dashboard/profile/__shared__/staffProfileShared";
import { ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";

const baseLabels = readTranslation(Translation.Profile.Base, locale);
const staffLabels = readTranslation(Translation.Profile.Staff, locale);

type StaffProfileSharedViewProps = ComponentProps<typeof StaffProfileSharedView>;

function buildProps(overrides: Partial<StaffProfileSharedViewProps>): StaffProfileSharedViewProps {
  return {
    labels: { base: baseLabels, staff: staffLabels },
    staffData: null,
    avatarUrl: null,
    displayCurrency: null,
    profileTimezone: null,
    profilePhone: null,
    isAdminScope: false,
    targetUserId: "user-1",
    meetingTabHref: "?tab=meeting",
    mode: ProfileMode.VIEW,
    scope: ProfileScope.OTHER,
    isSaving: false,
    onSubmitOwn: async () => {},
    onSubmitAdmin: async () => {},
    loading: false,
    error: undefined,
    refetch: () => {},
    activeTab: "profile",
    onTabChange: () => {},
    permissionGroups: [],
    permissionOverrides: [],
    canView: () => true,
    ViewContentWrapper: ({ children }) => <>{children}</>,
    ...overrides,
  };
}

function renderSharedView(overrides: Partial<StaffProfileSharedViewProps>) {
  const props = buildProps(overrides);
  return renderWithWrapper(<StaffProfileSharedView {...props} />, { locale });
}

describe("StaffProfileSharedView guard states", () => {
  test("renders LoadingState while loading without data", () => {
    renderSharedView({ loading: true, staffData: null });
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText(baseLabels.errors.failedToLoad)).not.toBeInTheDocument();
  });

  test("renders ErrorState with retry wired to refetch on error without data", () => {
    const refetch = mock(() => {});
    renderSharedView({ error: new Error("boom"), staffData: null, refetch });
    expect(screen.getByText(baseLabels.errors.failedToLoad)).toBeInTheDocument();
    const retryButton = screen.getByRole("button", { name: baseLabels.actions.retry });
    fireEvent.click(retryButton);
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  test("renders not-found warning when data is missing without loading or error", () => {
    renderSharedView({ staffData: null, canView: () => true });
    expect(screen.getByText(baseLabels.errors.notFound)).toBeInTheDocument();
  });

  test("renders restricted section instead of not-found when identity is not viewable", () => {
    renderSharedView({ staffData: null, canView: () => false });
    expect(screen.queryByText(baseLabels.errors.notFound)).not.toBeInTheDocument();
    expect(screen.getByText(baseLabels.fieldAccess.restrictedDescription)).toBeInTheDocument();
  });
});
