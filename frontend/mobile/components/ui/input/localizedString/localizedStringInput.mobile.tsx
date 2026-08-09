"use client";

import { EditOutlined } from "@mui/icons-material";
import { Box, Button, FormHelperText, IconButton, TextField } from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import { useRef } from "react";
import type { LocalizedStringInputProps } from "@/frontend/common/components/ui/input/localizedString/types";
import { useLocalizedStringInputState } from "@/frontend/common/hooks/useLocalizedStringInputState";
import { LocaleAdornmentSwitchMobile } from "@/frontend/mobile/components/ui/input/localizedString/localeAdornmentSwitch.mobile";
import { LocalizedStringDrawerMobile } from "@/frontend/mobile/components/ui/input/localizedString/localizedStringDrawer.mobile";
import type { LocalizedStringLabels } from "@/shared/locale";
import { Translation, useAppTranslation } from "@/shared/locale";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

type EditDrawerControlProps = {
  readonly t: LocalizedStringLabels;
  readonly isCompact: boolean;
  readonly disabled: boolean;
  readonly onOpen: () => void;
};

const EditDrawerControl: React.FC<EditDrawerControlProps> = ({ t, isCompact, disabled, onOpen }) => {
  if (isCompact) {
    return (
      <IconButton
        aria-label={t.editTranslations}
        onClick={onOpen}
        disabled={disabled}
        size="small"
        sx={{ flexShrink: 0 }}
      >
        <EditOutlined fontSize="small" />
      </IconButton>
    );
  }
  return (
    <Button
      variant="text"
      size="small"
      onClick={onOpen}
      disabled={disabled}
      startIcon={<EditOutlined fontSize="small" />}
      sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
    >
      {t.editTranslations}
    </Button>
  );
};

export const LocalizedStringInputMobile: React.FC<LocalizedStringInputProps> = ({
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
}) => {
  const t = useAppTranslation(Translation.Ui.LocalizedString);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    isCompact,
    activeLocale,
    draft,
    drawerOpen,
    successSwitch,
    resolvedRequiredLocales,
    fieldValue,
    isRtl,
    showInlineError,
    inlineHelperText,
    drawerResolvedTitle,
    textFieldSuccessSx,
    adornmentTopSx,
    handleFieldChange,
    handleLocaleSwitch,
    handleDrawerSave,
    handleDrawerCancel,
    setDrawerOpen,
  } = useLocalizedStringInputState({
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
      <TextField
        label={label}
        value={fieldValue}
        onChange={event => handleFieldChange(event.target.value)}
        onBlur={onBlurAction}
        required={required}
        disabled={disabled}
        error={showInlineError}
        multiline={multiline}
        minRows={minRows}
        fullWidth={fullWidth}
        size="small"
        dir={isRtl ? "rtl" : "ltr"}
        key={activeLocale}
        sx={textFieldSuccessSx}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            startAdornment: (
              <InputAdornment position="start" sx={adornmentTopSx}>
                <LocaleAdornmentSwitchMobile
                  activeLocale={activeLocale}
                  onChangeAction={handleLocaleSwitch}
                  disabled={disabled}
                  compact={isCompact}
                  successSwitch={successSwitch}
                />
              </InputAdornment>
            ),
            endAdornment: disableDrawer ? undefined : (
              <InputAdornment position="end" sx={adornmentTopSx}>
                <EditDrawerControl t={t} isCompact={isCompact} disabled={disabled} onOpen={() => setDrawerOpen(true)} />
              </InputAdornment>
            ),
          },
          htmlInput: { dir: isRtl ? "rtl" : "ltr" },
        }}
      />
      {inlineHelperText ? <FormHelperText error={showInlineError}>{inlineHelperText}</FormHelperText> : null}
      <LocalizedStringDrawerMobile
        open={drawerOpen}
        value={draft}
        title={drawerResolvedTitle}
        multiline={multiline}
        minRows={minRows}
        required={required}
        requiredLocales={resolvedRequiredLocales}
        onSaveAction={handleDrawerSave}
        onCancelAction={handleDrawerCancel}
        autosave={drawerAutosave}
        showActions={drawerShowActions}
        dismissAction={drawerDismissAction}
        saving={false}
      />
    </Box>
  );
};
