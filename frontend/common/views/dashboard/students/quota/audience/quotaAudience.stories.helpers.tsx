import type { MockLink } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing/react";
import type { Decorator } from "@storybook/nextjs-vite";
import { AccountStatus, type AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";

interface QuotaAudienceStoryUserInput {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly permissions: AppPermission[];
  readonly parentId?: string | null;
}

export function setQuotaAudienceStoryUser(input: Readonly<QuotaAudienceStoryUserInput>): void {
  useUserStore.setState({
    role: input.role,
    permissions: input.permissions,
    displayCurrency: CurrencyCode.Usd,
    user: {
      id: input.id,
      name: input.name,
      role: input.role,
      avatarUrl: null,
      permissions: input.permissions,
      notificationCount: 0,
      teacherId: null,
      parentId: input.parentId ?? null,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-06-01T00:00:00.000Z",
      emailVerifiedAt: null,
      email: null,
      phone: null,
      status: AccountStatus.Activated,
      displayCurrency: CurrencyCode.Usd,
    },
  });
}

export function withQuotaAudienceMocks(
  mocks: ReadonlyArray<MockLink.MockedResponse>,
  resetUser: () => void
): Decorator {
  return function QuotaAudienceMocksDecorator(Story) {
    resetUser();
    return (
      <MockedProvider mocks={mocks}>
        <Story />
      </MockedProvider>
    );
  };
}
