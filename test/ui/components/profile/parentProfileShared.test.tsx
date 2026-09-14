import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";

expect.extend(matchers);

import { AppPermission, ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { ParentProfileShared } from "@/frontend/common/views/dashboard/profile/parent/parentProfileShared";
import type { ParentOwnData } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { AssociatedStudentsSectionDesktopView } from "@/frontend/desktop/views/dashboard/profile/parent/sections/associatedStudentsSection.desktop";
import { ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import {
  associatedStudentsLabels,
  makeAssociatedStudentRow,
} from "@/test/ui/components/profile/associatedStudentsFixtures";
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
      StudentsSection: () => null,
    },
    ...overrides,
  };
}

function renderShared(overrides: Partial<ParentProfileSharedProps>, options: { permissions?: AppPermission[] } = {}) {
  const props = buildProps(overrides);
  return renderWithWrapper(<ParentProfileShared {...props} />, { locale, ...options });
}

const ownParentData: ParentOwnData = {
  id: "parent-own-1",
  name: "Noor Abdullah",
  email: "[EMAIL_REDACTED]",
  phone: "+966 50 123 4567",
  facebook: "facebook.com/noor",
  whatsapp: "+966501234567",
  twitter: "@noor",
  nationality: "SA",
  address: "123 King Fahd Rd, Riyadh",
};

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

describe("ParentProfileShared admin edit form", () => {
  test("renders lifecycle status as a labeled combobox in edit mode", async () => {
    renderShared(
      {
        mode: ProfileMode.EDIT,
        isAdminScope: true,
        scope: ProfileScope.OTHER,
        parentData: ownParentData,
        canView: () => true,
      },
      { permissions: [AppPermission.ProfileParentBillingEditOther] }
    );
    expect(await screen.findByRole("combobox", { name: parentLabels.fields.lifecycleStatus })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: parentLabels.fields.invoiceType })).toBeInTheDocument();
  });
});

describe("ParentProfileShared students section", () => {
  test("renders the injected students section rows under the parent_students permission gate", () => {
    renderShared({
      parentData: ownParentData,
      associatedStudents: {
        id: "associated-1",
        totalCount: 1,
        rows: [makeAssociatedStudentRow()],
      },
      slots: {
        ViewContentWrapper: ({ children }) => <>{children}</>,
        StudentsSection: ({ rows }) => <div>{rows.map(row => row.name).join(",")}</div>,
      },
    });
    expect(screen.getByText("Fatima Ahmad")).toBeInTheDocument();
  });

  test("hides the students section when parent_students is not permitted", () => {
    renderShared({
      parentData: ownParentData,
      canView: key => key !== "parent_students",
      slots: {
        ViewContentWrapper: ({ children }) => <>{children}</>,
        StudentsSection: () => <div data-testid="students-section" />,
      },
    });
    expect(screen.queryByTestId("students-section")).not.toBeInTheDocument();
  });

  test("delegates the students section to the real desktop variant", async () => {
    const { container } = renderShared({
      parentData: ownParentData,
      associatedStudents: {
        id: "associated-1",
        totalCount: 1,
        rows: [makeAssociatedStudentRow()],
      },
      slots: {
        ViewContentWrapper: ({ children }) => <>{children}</>,
        StudentsSection: AssociatedStudentsSectionDesktopView,
      },
    });
    await waitFor(() => {
      expect(container.querySelector(".MuiDataGrid-root")).not.toBeNull();
    });
    expect(screen.getByText(associatedStudentsLabels.parent.students.columns.name)).toBeInTheDocument();
  });
});
