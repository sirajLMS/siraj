import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { UserBillingProfileView } from "@/frontend/views/dashboard/users/billing-profile/UserBillingProfileView";
import { renderWithWrapper } from "./TestWrapper";

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
});

describe("UserBillingProfileView", () => {
  test("renders invalid user ID error when userId is empty", () => {
    renderWithWrapper(<UserBillingProfileView userId="" />, {
      locale: "en",
    });

    expect(screen.getByText("Invalid User ID")).toBeVisible();
  });

  test("renders profile details when authorized", () => {
    renderWithWrapper(<UserBillingProfileView userId="user-123" />, {
      locale: "en",
      permissions: [AppPermission.UserViewProfile],
    });

    expect(screen.getByText("User Billing Profile")).toBeVisible();
    expect(screen.getByText("Billing profile details for user user-123")).toBeVisible();
  });

  test("renders nothing when unauthorized", () => {
    renderWithWrapper(<UserBillingProfileView userId="user-123" />, {
      locale: "en",
      permissions: [],
    });

    expect(screen.queryByText("User Billing Profile")).toBeNull();
    expect(screen.queryByText("Billing profile details for user user-123")).toBeNull();
  });
});
