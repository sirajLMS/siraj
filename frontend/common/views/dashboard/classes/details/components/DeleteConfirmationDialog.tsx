import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";

export function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  cancelLabel,
  confirmLabel,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly title: string;
  readonly message: string;
  readonly cancelLabel: string;
  readonly confirmLabel: string;
}) {
  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={false}
      title={title}
      body={message}
      cancelLabel={cancelLabel}
      confirmLabel={confirmLabel}
    />
  );
}
