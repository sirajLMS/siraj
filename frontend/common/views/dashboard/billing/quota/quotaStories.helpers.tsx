import type { MockLink } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing/react";
import type { Decorator } from "@storybook/nextjs-vite";
import { AccountStatus, AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";

const QUOTA_PERMISSIONS = [AppPermission.QuotasManage, AppPermission.QuotasView];

function applyMockQuotaAdmin(permissions: AppPermission[] = QUOTA_PERMISSIONS): void {
  useUserStore.setState({
    permissions,
    user: {
      id: "mock-admin-001",
      name: "Admin User",
      role: "SUPERVISOR",
      avatarUrl: "",
      permissions,
      notificationCount: 0,
      teacherId: null,
      parentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerifiedAt: new Date().toISOString(),
      email: "[EMAIL_REDACTED]",
      phone: null,
      status: AccountStatus.Activated,
      displayCurrency: CurrencyCode.Usd,
    },
  });
}

export function withQuotaMocks(mocks: ReadonlyArray<MockLink.MockedResponse>, beforeRender?: () => void): Decorator {
  return function QuotaMocksDecorator(Story) {
    applyMockQuotaAdmin();
    beforeRender?.();
    return (
      <MockedProvider mocks={mocks}>
        <Story />
      </MockedProvider>
    );
  };
}
