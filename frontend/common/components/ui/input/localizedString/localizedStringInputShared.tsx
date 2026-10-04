"use client";

import { Box } from "@mui/material";
import { useRef } from "react";
import { LocalizedStringInputSharedView } from "@/frontend/common/components/ui/input/localizedString/localizedStringInputShared.parts";
import type {
  LocaleAdornmentSwitchProps,
  LocalizedStringDrawerProps,
  LocalizedStringInputProps,
} from "@/frontend/common/components/ui/input/localizedString/types";
import { useLocalizedStringInputState } from "@/frontend/common/hooks/useLocalizedStringInputState";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { Translation, useAppTranslation } from "@/shared/locale";

export type LocalizedStringInputSlotProps = {
  /** Locale-switch adornment component — supplied pre-bound with slot props. */
  readonly LocaleAdornmentSwitch: React.ComponentType<LocaleAdornmentSwitchProps>;
  /** Drawer editor component — supplied pre-bound with slot props. */
  readonly LocalizedStringDrawer: React.ComponentType<LocalizedStringDrawerProps>;
  /** Optional `TextField` size override (mobile uses `"small"`). */
  readonly textFieldSize?: "small" | "medium";
};

export function LocalizedStringInputShared({
  value,
  onChangeAction,
  onBlurAction,
  label,
  helperText,
  error = false,
  errorMessage,
  requiredLocales,
  required = false,
  multiline,
  minRows,
  disabled = false,
  fullWidth = true,
  drawerTitle,
  disableDrawer = false,
  drawerAutosave = false,
  drawerShowActions,
  drawerDismissAction = "save",
  sx,
  LocaleAdornmentSwitch,
  LocalizedStringDrawer,
  textFieldSize,
}: LocalizedStringInputProps & LocalizedStringInputSlotProps) {
  const t = useAppTranslation(Translation.Ui.LocalizedString);
  const containerRef = useRef<HTMLDivElement>(null);
  const state = useLocalizedStringInputState({
    value,
    onChangeAction,
    error,
    required,
    requiredLocales,
    errorMessage,
    helperText,
    label,
    drawerTitle,
    drawerAutosave,
    multiline,
    containerRef,
  });

  return (
    <Box ref={containerRef} sx={mergeSx({ width: fullWidth ? "100%" : undefined }, sx)}>
      <LocalizedStringInputSharedView
        t={t}
        state={state}
        label={label}
        required={required}
        onBlurAction={onBlurAction}
        disabled={disabled}
        multiline={multiline}
        minRows={minRows}
        fullWidth={fullWidth}
        textFieldSize={textFieldSize}
        disableDrawer={disableDrawer}
        LocaleAdornmentSwitch={LocaleAdornmentSwitch}
        LocalizedStringDrawer={LocalizedStringDrawer}
        drawerAutosave={drawerAutosave}
        drawerShowActions={drawerShowActions}
        drawerDismissAction={drawerDismissAction}
      />
    </Box>
  );
}
