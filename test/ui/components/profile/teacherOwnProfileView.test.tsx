import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

// Defensive mocks against bleed from earlier test files (Bun mock.module is process-global).
await mockNextNavigation("/profile", {
  locales: ["ar", "en"],
  defaultLocale: "en",
});

await mock.module("@/frontend/common/hooks/useLanguageSwitch", () => ({
  useLanguageSwitch: () => ({ currentLocale: "en", switchLanguage: () => {}, isPending: false }),
}));

import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { teacherOwnProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useTeacherOwnProfileViewModel } from "@/frontend/common/views/dashboard/teachers/own-profile/useTeacherOwnProfileViewModel";
import { TeacherOwnProfileDesktopView } from "@/frontend/desktop/views/dashboard/teachers/own-profile/teacherOwnProfileView.desktop";
import { TeacherOwnProfileMobileView } from "@/frontend/mobile/views/dashboard/teachers/own-profile/teacherOwnProfileView.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Dashboard.TeacherOwnProfile, locale);

function TeacherOwnProfileDesktopContainer() {
  const viewModel = useTeacherOwnProfileViewModel({});
  return <TeacherOwnProfileDesktopView {...viewModel} />;
}

function TeacherOwnProfileMobileContainer() {
  const viewModel = useTeacherOwnProfileViewModel({});
  return <TeacherOwnProfileMobileView {...viewModel} />;
}

const profileMockData = {
  teacherOwnProfile: {
    id: "teacher-1",
    name: "Mariam Teacher",
    email: "mariam@example.com",
    phone: "+201112223334",
    timezone: "Africa/Cairo",
    hourlyRate: "25",
    rateCurrency: "USD",
    displayAmount: null,
  },
};

function createMocks(): MockLink.MockedResponse[] {
  return [
    {
      request: {
        query: teacherOwnProfileQueryDocument,
      },
      result: { data: profileMockData },
      maxUsageCount: Number.POSITIVE_INFINITY,
    },
  ];
}

afterEach(() => {
  cleanup();
});

async function assertProfileSections() {
  await waitFor(() => {
    expect(screen.getByText("Mariam Teacher")).toBeInTheDocument();
  });
  expect(screen.getByText(labels.pageTitle)).toBeInTheDocument();
  expect(screen.getByText(labels.sections.contact)).toBeInTheDocument();
  expect(screen.getByText(labels.sections.salary)).toBeInTheDocument();
  expect(screen.getByText(labels.fields.fullName)).toBeInTheDocument();
  expect(screen.getByText(labels.fields.email)).toBeInTheDocument();
  expect(screen.getByText("mariam@example.com")).toBeInTheDocument();
}

/**
 * A section panel renders its title in a dedicated title bar only when the
 * scaffold passes the section `title` prop — otherwise the Panel holds the
 * body alone as its single child element.
 */
function expectSectionPanelTitleBar(title: string) {
  const panels = Array.from(document.querySelectorAll(".MuiPaper-root"));
  const panel = panels.find(
    element =>
      element.childElementCount >= 2 && (element.firstElementChild?.textContent?.includes(title) ?? false)
  );
  expect(panel).toBeDefined();
}

function assertSectionPanelTitleBars() {
  expectSectionPanelTitleBar(labels.sections.contact);
  expectSectionPanelTitleBar(labels.sections.salary);
}

describe("TeacherOwnProfileView (post profileLayoutShared migration)", () => {
  test("desktop view renders profile sections inside section panels", async () => {
    renderWithWrapper(<TeacherOwnProfileDesktopContainer />, {
      locale,
      themeMode: "dark",
      mocks: createMocks(),
      viewport: "desktop",
    });
    await assertProfileSections();
    assertSectionPanelTitleBars();
  });

  test("mobile view renders profile sections inside section panels", async () => {
    renderWithWrapper(<TeacherOwnProfileMobileContainer />, {
      locale,
      themeMode: "dark",
      mocks: createMocks(),
      viewport: "mobile",
    });
    await assertProfileSections();
    assertSectionPanelTitleBars();
  });

  test("load failure renders the shared ErrorState alert, not a bare error text", async () => {
    renderWithWrapper(<TeacherOwnProfileDesktopContainer />, {
      locale,
      themeMode: "dark",
      mocks: [
        {
          request: { query: teacherOwnProfileQueryDocument },
          error: new Error("network failure"),
          maxUsageCount: Number.POSITIVE_INFINITY,
        },
      ],
      viewport: "desktop",
    });

    const alertMessage = await screen.findByText(labels.errors.failedToLoad);
    expect(alertMessage.closest(".MuiAlert-root")).not.toBeNull();
  });
});
