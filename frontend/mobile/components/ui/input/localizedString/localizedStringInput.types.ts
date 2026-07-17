import type { SxProps, Theme } from "@mui/material/styles";
import type { AppLocale, LocalizedString } from "@/frontend/common/types/localized-string.types";

export type LocalizedStringInputProps = {
  readonly value: LocalizedString;
  readonly onChangeAction: (value: LocalizedString) => void;
  readonly onBlurAction?: () => void;
  readonly label?: string;
  readonly helperText?: string;
  readonly error?: boolean;
  readonly errorMessage?: string;
  readonly requiredLocales?: readonly AppLocale[];
  readonly required?: boolean;
  readonly multiline?: boolean;
  readonly minRows?: number;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  readonly drawerTitle?: string;
  readonly disableDrawer?: boolean;
  readonly drawerAutosave?: boolean;
  readonly drawerShowActions?: boolean;
  readonly drawerDismissAction?: "save" | "cancel";
  readonly sx?: SxProps<Theme>;
};
