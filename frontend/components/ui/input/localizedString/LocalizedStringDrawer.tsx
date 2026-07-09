"use client";

import { CloseOutlined } from "@mui/icons-material";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormHelperText,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LocaleEmoji } from "@/frontend/components/ui/display";
import { getLanguageDisplayName, getLanguageEmoji } from "@/frontend/lib/locale";
import { ALLOWED_LOCALES, hasRequiredLocalizedValue, setLocalizedString } from "@/frontend/lib/localized-string";
import type { AppLocale, LocalizedString } from "@/frontend/types/localized-string.types";
import { DEFAULT_CONTENT_LOCALE } from "@/shared/types/localized-string";

export type LocalizedStringDrawerProps = {
  readonly open: boolean;
  readonly value: LocalizedString;
  readonly title?: string;
  readonly multiline?: boolean;
  readonly minRows?: number;
  readonly required?: boolean;
  readonly requiredLocales?: readonly AppLocale[];
  readonly onSaveAction: (next: LocalizedString) => void;
  readonly onCancelAction: () => void;
  /** Disable Save while parent is performing a save mutation. */
  readonly saving?: boolean;
  /**
   * When `true`, each field edit commits to `onSaveAction` immediately.
   * The footer is hidden unless `showActions` is explicitly `true`.
   */
  readonly autosave?: boolean;
  /**
   * Render Cancel/Save in the drawer footer.
   * Defaults to `!autosave` (footer shown when not autosaving).
   */
  readonly showActions?: boolean;
  /**
   * What happens when the user dismisses via backdrop, Escape, or the header ×.
   * `save` (default): commit the draft when valid, then close.
   * `cancel`: close without saving (discard draft).
   */
  readonly dismissAction?: "save" | "cancel";
  /** Override anchor side; defaults to `right` (bottom sheet on mobile). */
  readonly anchor?: "right" | "left" | "top" | "bottom";
};

/**
 * Right-anchored Drawer that renders one `TextField` per `ALLOWED_LOCALES`
 * (`ar`, `en` today) for full multi-locale editing of a JSONB
 * `LocalizedString` map.
 *
 * Locales are sourced exclusively from `@/shared/i18n/routing`. To add a
 * locale, update `routing.locales` + `backend/enum/auth.enum.ts`
 * (`AppLanguage`) + `frontend/lib/locale/language/languages.ts`; this drawer
 * renders the new locale automatically — no Add-translation button.
 *
 * `Save` is disabled while `hasRequiredLocalizedValue(draft, requiredLocales)`
 * is false. `Cancel` reverts the draft to the prop `value`.
 *
 * `autosave` commits each edit via `onSaveAction` immediately (footer hidden
 * by default). `showActions` controls the Cancel/Save footer explicitly.
 *
 * Dismiss (backdrop, Escape, header ×) defaults to `dismissAction="save"`:
 * commits the draft when valid, then closes. Set `dismissAction="cancel"` to
 * discard on dismiss. The footer Cancel button always discards.
 */
export const LocalizedStringDrawer: React.FC<LocalizedStringDrawerProps> = ({
  open,
  value,
  title,
  multiline,
  minRows,
  required = false,
  requiredLocales,
  onSaveAction,
  onCancelAction,
  saving = false,
  autosave = false,
  showActions,
  dismissAction = "save",
  anchor = "right",
}) => {
  const t = useTranslations("ui.localizedString");
  const uiLocale = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const resolvedAnchor = isMobile ? "bottom" : anchor;
  const showFooter = showActions ?? !autosave;

  const resolvedRequired = useMemo(
    () => requiredLocales ?? (required ? [DEFAULT_CONTENT_LOCALE] : []),
    [requiredLocales, required]
  );
  const [draft, setDraft] = useState<LocalizedString>(value);

  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  const handleFieldChange = useCallback(
    (locale: AppLocale, text: string) => {
      setDraft(prev => {
        const next = setLocalizedString(prev, locale, text);
        if (autosave) {
          onSaveAction(next);
        }
        return next;
      });
    },
    [autosave, onSaveAction]
  );

  const valid = hasRequiredLocalizedValue(draft, resolvedRequired);
  const canSave = valid && !saving;

  const handleDismiss = useCallback(() => {
    if (autosave) {
      onCancelAction();
      return;
    }
    if (dismissAction === "save" && canSave) {
      onSaveAction(draft);
      return;
    }
    onCancelAction();
  }, [autosave, dismissAction, canSave, draft, onSaveAction, onCancelAction]);

  const headerTitle = title ?? t("editTranslations");

  const requiredSet = useMemo(() => new Set<AppLocale>(resolvedRequired), [resolvedRequired]);

  const helperText = useMemo(() => {
    if (!required && resolvedRequired.length === 0) {
      return undefined;
    }
    if (resolvedRequired.length > 0) {
      const missing = resolvedRequired.filter(locale => {
        const v = draft[locale];
        return !(typeof v === "string" && v.trim() !== "");
      });
      if (missing.length === 1) {
        const name = getLanguageDisplayName(missing[0], uiLocale);
        return t("localeRequired", { localeName: name });
      }
      if (missing.length > 1) {
        const names = missing.map(l => getLanguageDisplayName(l, uiLocale)).join(", ");
        return t("localesRequired", { localeNames: names });
      }
    }
    if (required) {
      return t("atLeastOneTranslationRequired");
    }
    return undefined;
  }, [draft, required, resolvedRequired, t, uiLocale]);

  return (
    <Drawer
      open={open}
      anchor={resolvedAnchor}
      onClose={handleDismiss}
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? "100%" : { xs: "100%", sm: 480 },
            maxHeight: isMobile ? "85vh" : "100%",
            borderTopLeftRadius: isMobile ? 16 : 0,
            borderTopRightRadius: isMobile ? 16 : 0,
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexShrink: 0 }}
      >
        <Typography variant="h6" component="span">
          {headerTitle}
        </Typography>
        <IconButton onClick={handleDismiss} disabled={saving} size="small" aria-label={t("cancel")}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent dividers sx={{ flex: 1, overflow: "auto" }}>
        <Stack sx={{ gap: 2.5 }}>
          {ALLOWED_LOCALES.map(locale => {
            const isLocaleRequired = requiredSet.has(locale);
            const fieldValue = draft[locale] ?? "";
            const isRtl = locale === "ar";
            const languageName = getLanguageDisplayName(locale, uiLocale);
            const emoji = getLanguageEmoji(locale);
            const label = `${languageName}${isLocaleRequired ? " *" : ""}`;
            const showError = isLocaleRequired && !(typeof fieldValue === "string" && fieldValue.trim() !== "");
            return (
              <TextField
                key={locale}
                label={label}
                value={fieldValue}
                onChange={event => handleFieldChange(locale, event.target.value)}
                multiline={multiline}
                minRows={minRows}
                error={showError}
                helperText={showError ? t("localeRequiredEntry", { localeName: languageName }) : undefined}
                disabled={saving}
                dir={isRtl ? "rtl" : "ltr"}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocaleEmoji emoji={emoji} />
                      </InputAdornment>
                    ),
                  },
                  htmlInput: { dir: isRtl ? "rtl" : "ltr" },
                }}
              />
            );
          })}
          {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
        </Stack>
      </DialogContent>
      {showFooter ? (
        <DialogActions
          sx={{
            px: 3,
            pb: theme => `calc(${theme.spacing(3)} + env(safe-area-inset-bottom, 0px))`,
            pt: 2,
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          <Button
            onClick={onCancelAction}
            disabled={saving}
            variant="text"
            sx={{ flex: isMobile ? 1 : undefined, minHeight: isMobile ? 48 : undefined }}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            disabled={!canSave}
            onClick={() => onSaveAction(draft)}
            sx={{ flex: isMobile ? 1 : undefined, minHeight: isMobile ? 48 : undefined }}
          >
            {t("save")}
          </Button>
        </DialogActions>
      ) : null}
    </Drawer>
  );
};
