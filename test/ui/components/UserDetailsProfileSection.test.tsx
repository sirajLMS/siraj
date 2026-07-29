import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { UserDetailsProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/UserDetailsProfileSection";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

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
        locale: "en",
        permissions: [AppPermission.ProfileCoreContactViewOwn, AppPermission.ProfileCoreIdentityViewOwn],
      }
    );

    expect(await findByText("Phone")).toBeInTheDocument();
    expect(await findByText("Timezone")).toBeInTheDocument();
    expect(await findByText("Currency")).toBeInTheDocument();
    const notSetLabels = await findAllByText("Not set");
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
        timezone="Asia/Riyadh"
        displayCurrency={CurrencyCode.Usd}
      />,
      { permissions: [] }
    );

    expect(container).toBeEmptyDOMElement();
  });
});
