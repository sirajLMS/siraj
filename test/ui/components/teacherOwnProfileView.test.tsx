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
  expect(screen.getByText("mariam@example.com")).toBeInTheDocument();
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
  });

  test("mobile view renders profile sections inside section panels", async () => {
    renderWithWrapper(<TeacherOwnProfileMobileContainer />, {
      locale,
      themeMode: "dark",
      mocks: createMocks(),
      viewport: "mobile",
    });
    await assertProfileSections();
  });
});
