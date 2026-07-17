import type { LanguageType } from "@/frontend/common/lib/locale";

export type LanguageSelectorProps = {
  readonly language?: LanguageType;
  readonly setLanguageAction: (language: LanguageType) => void;
  readonly fullWidth?: boolean;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly onBlurAction?: () => void;
  readonly style?: React.CSSProperties;
};
