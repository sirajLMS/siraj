import type { ReactNode, SyntheticEvent } from "react";

export interface FormDialogShellProps {
  /** Whether the dialog is rendered. */
  readonly open: boolean;
  /** Dialog title rendered in the shared DialogTitle slot. */
  readonly title: string;
  /** Close handler for the Cancel button and backdrop/escape dismissal; suppressed while submitting. */
  readonly onClose: () => void;
  /** Submit handler for the `<form>` the shell owns; the shared actions live inside it. */
  readonly onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
  /** Disables both actions, suppresses dismissal, and swaps in a spinner on the submit button. */
  readonly submitting: boolean;
  readonly cancelLabel: string;
  readonly submitLabel: string;
  /** Caption swapped onto the submit action while a submission is in flight; the action keeps submitLabel with a spinner when omitted. */
  readonly submittingLabel?: string;
  /** Renders the dialog edge-to-edge; the mobile tier wrapper sets this. */
  readonly fullScreen?: boolean;
  /** Dialog body rendered inside the dividers content area, inside the shell-owned form. */
  readonly children?: ReactNode;
}
