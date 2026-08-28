import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

expect.extend(matchers);

import { ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { ParentProfileShared } from "@/frontend/common/views/dashboard/profile/parent/parentProfileShared";
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
const parentLabels = readTranslation(Translation.Profile.Parent, locale);

type ParentProfileSharedProps = ComponentProps<typeof ParentProfileShared>;

function buildProps(overrides: Partial<ParentProfileSharedProps>): ParentProfileSharedProps {
  return {
    labels: { base: baseLabels, parent: parentLabels },
    scope: ProfileScope.OWN,
    mode: ProfileMode.VIEW,
    targetUserId: "user-1",
    activeTab: "profile",
    isAdminScope: false,
    loading: false,
    error: undefined,
    isSaving: false,
    onSubmit: async () => {},
    onRetry: () => {},
    parentData: null,
    editData: {
      name: "",
      email: "",
      avatarUrl: null,
      displayCurrency: null,
      phone: "",
      facebook: "",
      whatsapp: "",
      twitter: "",
      nationality: "",
      address: "",
      invoiceType: "",
      feeAmount: "",
      currency: undefined,
      timezone: "",
      lifecycleStatus: ParentStatus.Regular,
    },
    avatarUrl: null,
    displayCurrency: null,
    profileTimezone: null,
    profilePhone: null,
    parentId: null,
    meetingTabHref: "?tab=meeting",
    associatedStudents: null,
    canView: () => true,
    slots: {
      ViewContentWrapper: ({ children }) => <>{children}</>,
      SectionPanel: ({ children }) => <>{children}</>,
    },
    ...overrides,
  };
}

function renderShared(overrides: Partial<ParentProfileSharedProps>) {
  const props = buildProps(overrides);
  return renderWithWrapper(<ParentProfileShared {...props} />, { locale });
}

describe("ParentProfileShared guard states", () => {
  test("renders LoadingState while loading without data", () => {
    renderShared({ loading: true, parentData: null });
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText(baseLabels.errors.failedToLoad)).not.toBeInTheDocument();
  });

  test("renders ErrorState whose retry invokes onRetry on error without data", () => {
    const onRetry = mock(() => {});
    renderShared({ error: new Error("boom"), parentData: null, onRetry });
    expect(screen.getByText(baseLabels.errors.failedToLoad)).toBeInTheDocument();
    const retryButton = screen.getByRole("button", { name: baseLabels.actions.retry });
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("renders not-found warning when data is missing without loading or error", () => {
    renderShared({ parentData: null });
    expect(screen.getByText(baseLabels.errors.notFound)).toBeInTheDocument();
  });
});
