import type { ReactNode } from "react";

export interface BaseFormDialogSectionProps {
  readonly title: string;
  /** Accessible labelled-by id for the dialog title (wired to the parent Dialog's aria-labelledby). */
  readonly titleId?: string;
  /** Optional icon rendered inside the circular header badge; omitted renders a plain title. */
  readonly icon?: ReactNode;
  /** Dialog body rendered inside the shared dialog content. */
  readonly children?: ReactNode;
  readonly cancelLabel: string;
  readonly confirmLabel: string;
  /** Label swapped in on the confirm button while loading; omitted shows a spinner. */
  readonly confirmLoadingLabel?: string;
  readonly onClose: () => void;
  /** Click handler for the confirm button when the dialog has no form element. */
  readonly onConfirm?: () => void;
  /** HTML id of the `<form>` the confirm button submits natively. */
  readonly formId?: string;
  readonly isLoading: boolean;
}
