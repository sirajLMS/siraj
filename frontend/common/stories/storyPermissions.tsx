import { AccountStatus, type AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";

/**
 * Shared fixture for container-grade stories under `frontend/stories/**` that
 * need to seed the user permission store. The 26-line
 * `seedPermissions(perms: AppPermission[])` block was duplicated byte-for-byte
 * across `ClassDetailsContainer.stories.tsx`, `ReportsContainer.stories.tsx`,
 * `SubjectsContainer.stories.tsx`, `TeacherOnboardingView.stories.tsx`
 * (Sonar cluster 2). Import this single implementation instead.
 */
export function seedPermissions(perms: AppPermission[]): void {
  useUserStore.setState({
    permissions: perms,
    user: {
      id: "mock-id",
      name: "Mock User",
      role: "Mock Role",
      avatarUrl: "",
      permissions: perms,
      notificationCount: 0,
      teacherId: null,
      parentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerifiedAt: new Date().toISOString(),
      email: "mock@example.com",
      phone: null,
      status: AccountStatus.Activated,
      displayCurrency: CurrencyCode.Usd,
    },
  });
}

/**
 * Storybook decorator factory that seeds the user permission store for the
 * lifetime of the story. Use as `decorators: [withPermissions([AppPermission.X])]`.
 *
 * Implements the Storybook decorator contract `(Story) => ReactNode` but
 * factors the JSX into a named component to satisfy `react/display-name`.
 */
export function withPermissions(perms: AppPermission[]) {
  return function WithPermissionsDecorator({ Story }: { Story: () => React.ReactNode }) {
    seedPermissions(perms);
    return <Story />;
  };
}
