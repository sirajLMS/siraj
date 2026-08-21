import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { UserDetailsProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/UserDetailsProfileSection";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

const locale: AppLocale = "en";
const profileBaseLabels = readTranslation(Translation.Profile.Base, locale);

afterEach(() => {
  cleanup();
  useUserStore.setState({ user: null, permissions: [] }, false);
});

describe("UserDetailsProfileSection", () => {
  test("shows Not set rows when contact view_own granted and values are null", async () => {
    const { findByText, findAllByText } = renderWithWrapper(
      <UserDetailsProfileSection
        sectionTitle="User details"
        phoneLabel="Phone"
        timezoneLabel="Timezone"
        currencyLabel="Currency"
        phone={null}
        timezone={null}
        displayCurrency={null}
      />,
      {
        locale,
        permissions: [AppPermission.ProfileCoreContactViewOwn, AppPermission.ProfileCoreIdentityViewOwn],
      }
    );

    expect(await findByText("Phone")).toBeInTheDocument();
    expect(await findByText("Timezone")).toBeInTheDocument();
    expect(await findByText("Currency")).toBeInTheDocument();
    const notSetLabels = await findAllByText(profileBaseLabels.notSet);
    expect(notSetLabels.length).toBeGreaterThanOrEqual(3);
  });

  test("hides section when contact and identity view denied", () => {
    useUserStore.setState({ user: null, permissions: [] }, false);
    const { container } = renderWithWrapper(
      <UserDetailsProfileSection
        sectionTitle="User details"
        phoneLabel="Phone"
        timezoneLabel="Timezone"
        currencyLabel="Currency"
        phone="+123"
        timezone={IanaTimezone.Asia_Riyadh}
        displayCurrency={CurrencyCode.Usd}
      />,
      { locale, permissions: [] }
    );

    expect(container).toBeEmptyDOMElement();
  });
});
