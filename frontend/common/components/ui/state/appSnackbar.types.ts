export interface AppSnackbarState {
  readonly open: boolean;
  readonly message: string;
  readonly severity: "success" | "error";
}
