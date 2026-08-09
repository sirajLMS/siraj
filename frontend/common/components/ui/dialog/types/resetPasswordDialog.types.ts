export interface ResetPasswordDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (password: string, sendEmail: boolean) => void;
  readonly isLoading: boolean;
  readonly userName: string;
  readonly userEmail: string;
  readonly sendEmail: boolean;
  readonly setSendEmail: (value: boolean) => void;
}
