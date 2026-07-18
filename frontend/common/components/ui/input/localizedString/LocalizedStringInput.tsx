"use client";

import { EditOutlined } from "@mui/icons-material";
import { Box, Button, FormHelperText, IconButton, TextField } from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import { useRef } from "react";
import { useLocalizedStringInputState } from "@/frontend/common/components/ui/input/localizedString/hooks";
import { LocaleAdornmentSwitch } from "@/frontend/common/components/ui/input/localizedString/LocaleAdornmentSwitch";
import { LocalizedStringDrawer } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringDrawer";
import type { LocalizedStringInputProps } from "@/frontend/common/components/ui/input/localizedString/types";
import type { LocalizedStringLabels } from "@/shared/locale";

/**
 * Inline single-locale editor for a JSONB `LocalizedString` map.
 *
 * The component edits one `AppLocale` at a time (the *active editing locale*,
 * default `useLocale()`). The start adornment (`LocaleAdornmentSwitch`)
 * shows the active locale's flag + display name and, on click, commits the
 * current value before swapping to another locale — adds a 500ms green
 * success tint when the committed value passed validation. The end adornment
 * is a `TextButton` "Edit translations" that opens the full
 * `LocalizedStringDrawer` listing one `TextField` per `ALLOWED_LOCALES`.
 *
 * Locales are sourced from `@/shared/i18n/routing`; there is no
 * "Add translation" button. To add a locale, update `routing.locales` +
 * `backend/enum/auth.enum.ts` (`AppLanguage`) +
 * `frontend/lib/locale/language/languages.ts`.
 */
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

export const LocalizedStringInput: React.FC<LocalizedStringInputProps> = ({
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
    <Box ref={containerRef} sx={{ width: fullWidth ? "100%" : undefined, ...sx }}>
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
        dir={isRtl ? "rtl" : "ltr"}
        key={activeLocale}
        sx={textFieldSuccessSx}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            startAdornment: (
              <InputAdornment position="start" sx={adornmentTopSx}>
                <LocaleAdornmentSwitch
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
      <LocalizedStringDrawer
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
