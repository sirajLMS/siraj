import type { MockLink } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing/react";
import { type ReactNode, useEffect } from "react";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { superAdminStoryUser } from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.stories.fixtures";

/**
 * Story decorator shell: seeds the (mock) user store with the super-admin
 * actor and wraps the story in an Apollo `MockedProvider` backed by the
 * story's mocked impersonation/simulation status queries.
 */
export function StoryShell({
  mocks,
  children,
}: Readonly<{ mocks: ReadonlyArray<MockLink.MockedResponse>; children: ReactNode }>) {
  const { setUser, setActorIsSuperAdmin } = useUserStore();

  useEffect(() => {
    setUser(superAdminStoryUser);
    setActorIsSuperAdmin(true);
  }, [setUser, setActorIsSuperAdmin]);

  return <MockedProvider mocks={mocks}>{children}</MockedProvider>;
}
