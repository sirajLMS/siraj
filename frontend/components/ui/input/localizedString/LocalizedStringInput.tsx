"use client";

import { EditOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  FormHelperText,
  IconButton,
  type SxProps,
  TextField,
  type Theme,
} from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LocaleAdornmentSwitch } from "@/frontend/components/ui/input/localizedString/LocaleAdornmentSwitch";
import { LocalizedStringDrawer } from "@/frontend/components/ui/input/localizedString/LocalizedStringDrawer";
import { useLocaleSwitchSuccess } from "@/frontend/components/ui/input/localizedString/useLocaleSwitchSuccess";
import { useNarrowContainer } from "@/frontend/components/ui/input/localizedString/useNarrowContainer";
import { pickInitialActiveLocale, setLocalizedString } from "@/frontend/lib/localized-string";
import type { AppLocale, LocalizedString } from "@/frontend/types/localized-string.types";
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
  const t = useTranslations("ui.localizedString");
  const uiLocale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const isCompact = useNarrowContainer(containerRef);

  const resolvedRequiredLocales = useMemo(
    () => requiredLocales ?? (required ? [DEFAULT_CONTENT_LOCALE] : []),
    [requiredLocales, required]
  );

  const [activeLocale, setActiveLocale] = useState<AppLocale>(() => pickInitialActiveLocale(uiLocale));
  const [draft, setDraft] = useState<LocalizedString>(value);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { successSwitch, triggerSuccess } = useLocaleSwitchSuccess();

  // Sync the draft when the parent prop changes (e.g. form reset).
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
      // Commit current text under the active locale before switching — the
      // draft already holds it via handleFieldChange, so we only need to
      // validate the just-written value to decide the green tint.
      const currentValue = draft[activeLocale] ?? "";
      const wasValid =
        currentValue.trim() !== "" &&
        // If the active locale was required, it must be non-empty.
        (!resolvedRequiredLocales.includes(activeLocale) || currentValue.trim() !== "");
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

  // Resolve per-state helper text/error: parent-supplied errorMessage takes
  // precedence, then required-locale error, then optional helperText.
  const activeRequired = requiredSet.has(activeLocale);
  const showInlineError = error || (activeRequired && fieldValue.trim() === "" && required);
  const inlineHelperText =
    errorMessage ??
    (activeRequired && fieldValue.trim() === "" && required
      ? t("localeRequiredEntry", { localeName: t(`locale.${activeLocale}`) })
      : helperText);

  const drawerResolvedTitle = drawerTitle ?? label ?? t("editTranslations");

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
        sx={
          successSwitch && !showInlineError
            ? {
                "& .MuiOutlinedInput-root": {
                  borderColor: theme => theme.palette.success.main,
                },
                transition: theme => theme.transitions.create("border-color", { duration: 500 }),
              }
            : undefined
        }
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            startAdornment: (
              <InputAdornment position="start">
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
              <InputAdornment position="end">
                {isCompact ? (
                  <IconButton
                    aria-label={t("editTranslations")}
                    onClick={() => setDrawerOpen(true)}
                    disabled={disabled}
                    size="small"
                    sx={{ flexShrink: 0 }}
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                ) : (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setDrawerOpen(true)}
                    disabled={disabled}
                    startIcon={<EditOutlined fontSize="small" />}
                    sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
                  >
                    {t("editTranslations")}
                  </Button>
                )}
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
