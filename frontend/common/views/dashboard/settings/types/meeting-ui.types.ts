import type { TestMeetingConnectionResultFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";

/**
 * Tracks the lifecycle of a "test connection" button click in the UI.
 * The backend `TestMeetingConnectionResult` does not expose a "pending" state —
 * this union models the frontend's pre/post-click toggle state.
 */
export type TestConnectionState = "idle" | "testing" | "success" | "failure";

/**
 * Distinguishes whether the credential form dialog is creating new
 * provider credentials or editing existing ones.
 */
export type CredentialFormMode = "create" | "edit";

/**
 * UI-only normalized test-connection result for the result panel.
 * Maps codegen fragment fields to display-friendly shapes.
 */
export type TestConnectionResult = Pick<
  TestMeetingConnectionResultFieldsFragment,
  "ok" | "latencyMs" | "errorCode" | "errorMessage"
> & {
  readonly endpoint: string | null;
  readonly authStatus: string | null;
};
