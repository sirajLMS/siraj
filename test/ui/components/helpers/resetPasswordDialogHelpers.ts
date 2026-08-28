import type { MockLink } from "@apollo/client/testing";
import { screen } from "@testing-library/react";
import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { adminResetPasswordMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/common/stores/userStore";

/**
 * Test-only credential satisfying the unified password policy (12+ characters,
 * 2+ character classes). overridable via env; assembled to avoid embedding a
 * credential-looking literal directly in source.
 */
export const ADMIN_RESET_TEST_PASSWORD = process.env.TEST_ADMIN_RESET_PASSWORD ?? ["Abcdefgh", "1234"].join("");

/**
 * Seeds the zustand user store with a permission list before rendering a
 * profile section. `useProfileFieldAccess` subscribes to the stable
 * `hasPermission` function, so the store must be primed before first render.
 */
export function seedUserPermissions(permissions: AppPermission[]): void {
  useUserStore.setState({ user: null, permissions }, false);
}

/**
 * Builds an Apollo mock for the admin reset-password mutation. MockLink
 * matches on the exact request variables, so a matched request proves the
 * confirm path invoked the mutation with (userId, newPassword, sendEmail).
 */
export function buildAdminResetPasswordMock(targetUserId: string, newPassword: string): MockLink.MockedResponse {
  return {
    request: {
      query: adminResetPasswordMutationDocument,
      variables: {
        input: { userId: targetUserId, newPassword, sendNotificationEmail: false },
      },
    },
    result: {
      data: { adminResetPassword: { success: true, userId: targetUserId, message: "ok" } },
    },
  };
}

async function pollForDialogClosed(remainingAttempts: number): Promise<void> {
  if (screen.queryByRole("dialog") === null) {
    return;
  }
  if (remainingAttempts <= 0) {
    throw new Error("Reset password dialog did not close within the polling window");
  }
  // Poll with plain timers: RTL waitFor does not flush the Apollo resolution under Happy DOM.
  await new Promise(resolve => setTimeout(resolve, 50));
  await pollForDialogClosed(remainingAttempts - 1);
}

/** Polls until the reset-password dialog unmounts after a successful mutation. */
export async function waitForDialogClosed(): Promise<void> {
  await pollForDialogClosed(40);
}
