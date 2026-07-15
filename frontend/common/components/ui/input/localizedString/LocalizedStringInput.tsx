"use client";

import { EditOutlined } from "@mui/icons-material";
import { Box, Button, FormHelperText, IconButton, type SxProps, TextField, type Theme } from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LocaleAdornmentSwitch } from "@/frontend/common/components/ui/input/localizedString/LocaleAdornmentSwitch";
import { LocalizedStringDrawer } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringDrawer";
import { useLocaleSwitchSuccess } from "@/frontend/common/components/ui/input/localizedString/useLocaleSwitchSuccess";
import { useNarrowContainer } from "@/frontend/common/components/ui/input/localizedString/useNarrowContainer";
import { getLanguageDisplayName } from "@/frontend/common/lib/locale";
import { pickInitialActiveLocale, setLocalizedString } from "@/frontend/common/lib/localized-string";
import { useAppLocale } from "@/frontend/common/providers/LocaleProvider";
import type { AppLocale, LocalizedString } from "@/frontend/common/types/localized-string.types";
import { useAppTranslation } from "@/shared/locale/client";
import { DEFAULT_CONTENT_LOCALE } from "@/shared/types/localized-string";

export type LocalizedStringInputProps = {
  readonly value: LocalizedString;
  readonly onChangeAction: (value: LocalizedString) => void;
  readonly onBlurAction?: () => void;
  readonly label?: string;
  readonly helperText?: string;
  readonly error?: boolean;
  readonly errorMessage?: string;
  /** Required locales; default `["ar"]` when `required` is true. */
  readonly requiredLocales?: readonly AppLocale[];
  /** At least one non-empty entry is required (form-level `required`). */
  readonly required?: boolean;
  readonly multiline?: boolean;
  readonly minRows?: number;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  /** Drawer title; defaults to `label`. */
  readonly drawerTitle?: string;
  /** Disable the end-adornment button + drawer (e.g. read-only mode). */
  readonly disableDrawer?: boolean;
  /**
   * When `true`, drawer field edits commit to `onChangeAction` on each change
   * (no Save button unless `drawerShowActions` is set).
   */
  readonly drawerAutosave?: boolean;
  /**
   * Show Cancel/Save in the drawer footer.
   * Defaults to `!drawerAutosave`.
   */
  readonly drawerShowActions?: boolean;
  /**
   * Drawer dismiss (×, backdrop, Escape): `save` commits when valid (default),
   * `cancel` discards. Footer Cancel always discards.
   */
  readonly drawerDismissAction?: "save" | "cancel";
  /** Optional sx passthrough applied to the wrapper Box. */
  readonly sx?: SxProps<Theme>;
};

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
  readonly t: ReturnType<typeof useAppTranslation<"ui.localizedString">>;
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

type LocalizedStringInputStateProps = {
  readonly value: LocalizedString;
  readonly onChangeAction: (value: LocalizedString) => void;
  readonly error: boolean;
  readonly required: boolean;
  readonly requiredLocales?: readonly AppLocale[];
  readonly errorMessage?: string;
  readonly helperText?: string;
  readonly label?: string;
  readonly drawerTitle?: string;
  readonly drawerAutosave: boolean;
  readonly multiline?: boolean;
  readonly containerRef: React.RefObject<HTMLDivElement | null>;
};

type LocalizedStringInputState = {
  readonly isCompact: boolean;
  readonly activeLocale: AppLocale;
  readonly draft: LocalizedString;
  readonly drawerOpen: boolean;
  readonly successSwitch: boolean;
  readonly resolvedRequiredLocales: readonly AppLocale[];
  readonly fieldValue: string;
  readonly isRtl: boolean;
  readonly showInlineError: boolean;
  readonly inlineHelperText: string | undefined;
  readonly drawerResolvedTitle: string;
  readonly textFieldSuccessSx: SxProps<Theme> | undefined;
  readonly adornmentTopSx: { alignSelf: string; height: string; marginTop: number } | undefined;
  readonly handleFieldChange: (text: string) => void;
  readonly handleLocaleSwitch: (nextLocale: AppLocale) => void;
  readonly handleDrawerSave: (next: LocalizedString) => void;
  readonly handleDrawerCancel: () => void;
  readonly setDrawerOpen: (open: boolean) => void;
};

const useLocalizedStringInputState = ({
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
}: LocalizedStringInputStateProps): LocalizedStringInputState => {
  const t = useAppTranslation("ui.localizedString");
  const uiLocale = useAppLocale();
  const isCompact = useNarrowContainer(containerRef);

  const resolvedRequiredLocales = useMemo(
    () => requiredLocales ?? (required ? [DEFAULT_CONTENT_LOCALE] : []),
    [requiredLocales, required]
  );

  const [activeLocale, setActiveLocale] = useState<AppLocale>(() => pickInitialActiveLocale(uiLocale));
  const [draft, setDraft] = useState<LocalizedString>(value);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { successSwitch, triggerSuccess } = useLocaleSwitchSuccess();

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const emitChange = useCallback(
    (next: LocalizedString) => {
      setDraft(next);
      onChangeAction(next);
    },
    [onChangeAction]
  );

  const handleFieldChange = useCallback(
    (text: string) => {
      emitChange(setLocalizedString(draft, activeLocale, text));
    },
    [draft, activeLocale, emitChange]
  );

  const handleLocaleSwitch = useCallback(
    (nextLocale: AppLocale) => {
      const currentValue = draft[activeLocale] ?? "";
      const wasValid =
        currentValue.trim() !== "" && (!resolvedRequiredLocales.includes(activeLocale) || currentValue.trim() !== "");
      setActiveLocale(nextLocale);
      if (wasValid && !error) {
        triggerSuccess();
      }
    },
    [draft, activeLocale, error, resolvedRequiredLocales, triggerSuccess]
  );

  const handleDrawerSave = useCallback(
    (next: LocalizedString) => {
      emitChange(next);
      if (!drawerAutosave) {
        setDrawerOpen(false);
      }
    },
    [emitChange, drawerAutosave]
  );

  const handleDrawerCancel = useCallback(() => setDrawerOpen(false), []);

  const fieldValue = draft[activeLocale] ?? "";
  const isRtl = activeLocale === "ar";

  const requiredSet = useMemo(() => new Set<AppLocale>(resolvedRequiredLocales), [resolvedRequiredLocales]);

  const activeRequired = requiredSet.has(activeLocale);
  const showInlineError = error || (activeRequired && fieldValue.trim() === "" && required);
  const inlineHelperText =
    errorMessage ??
    (activeRequired && fieldValue.trim() === "" && required
      ? t.localeRequiredEntry(getLanguageDisplayName(activeLocale, uiLocale))
      : helperText);

  const drawerResolvedTitle = drawerTitle ?? label ?? t.editTranslations;

  const textFieldSuccessSx =
    successSwitch && !showInlineError
      ? {
          "& .MuiOutlinedInput-root": {
            borderColor: (theme: Theme) => theme.palette.success.main,
          },
          transition: (theme: Theme) => theme.transitions.create("border-color", { duration: 500 }),
        }
      : undefined;

  const adornmentTopSx = multiline ? { alignSelf: "flex-start", height: "auto", marginTop: 1.75 } : undefined;

  return {
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
  };
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
  const t = useAppTranslation("ui.localizedString");
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
