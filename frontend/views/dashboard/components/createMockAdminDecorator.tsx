import type { Decorator } from "@storybook/react";
import { type AppPermission, CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";

export function createMockAdminDecorator(permissions: readonly AppPermission[]): Decorator[] {
  return [
    Story => {
      const mockUser = {
        id: "mock-admin-id",
        name: "Admin User",
        role: "Administrator",
        avatarUrl: "",
        permissions: [...permissions],
        notificationCount: 0,
        teacherId: null,
        parentId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerifiedAt: new Date().toISOString(),
        email: "admin@example.com",
        displayCurrency: CurrencyCode.Usd,
        __typename: "User" as const,
      };
      useUserStore.setState({ permissions, user: mockUser });
      return <Story />;
    },
  ];
}
