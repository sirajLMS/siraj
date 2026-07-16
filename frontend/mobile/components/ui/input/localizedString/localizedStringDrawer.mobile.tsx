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
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LocaleEmoji } from "@/frontend/common/components/ui/display";
import type { LocalizedStringDrawerProps } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringDrawer";
import { getLanguageDisplayName, getLanguageEmoji } from "@/frontend/common/lib/locale";
import { ALLOWED_LOCALES, hasRequiredLocalizedValue, setLocalizedString } from "@/frontend/common/lib/localized-string";
import type { AppLocale, LocalizedString } from "@/frontend/common/types/localized-string.types";
import { type LocalizedStringLabels, useAppLocale, useAppTranslation } from "@/shared/locale";
import { DEFAULT_CONTENT_LOCALE } from "@/shared/types/localized-string";

type HelperTextParams = {
  readonly draft: LocalizedString;
  readonly required: boolean;
  readonly resolvedRequired: readonly AppLocale[];
  readonly uiLocale: string;
  readonly t: LocalizedStringLabels;
};

function buildHelperText({ draft, required, resolvedRequired, uiLocale, t }: HelperTextParams): string | undefined {
  if (!required && resolvedRequired.length === 0) {
    return undefined;
  }
  if (resolvedRequired.length > 0) {
    const missing = resolvedRequired.filter(locale => {
      const v = draft[locale];
      return !(typeof v === "string" && v.trim() !== "");
    });
    if (missing.length === 1) {
      return t.localeRequired(getLanguageDisplayName(missing[0], uiLocale));
    }
    if (missing.length > 1) {
      const names = missing.map(l => getLanguageDisplayName(l, uiLocale)).join(", ");
      return t.localesRequired(names);
    }
  }
  if (required) {
    return t.atLeastOneTranslationRequired;
  }
  return undefined;
}

function resolveDismiss(params: {
  readonly autosave: boolean;
  readonly dismissAction: "save" | "cancel";
  readonly canSave: boolean;
  readonly draft: LocalizedString;
  readonly onSaveAction: (next: LocalizedString) => void;
  readonly onCancelAction: () => void;
}): void {
  const { autosave, dismissAction, canSave, draft, onSaveAction, onCancelAction } = params;
  if (autosave) {
    onCancelAction();
    return;
  }
  if (dismissAction === "save" && canSave) {
    onSaveAction(draft);
    return;
  }
  onCancelAction();
}

function resolveFieldChange(params: {
  readonly draft: LocalizedString;
  readonly locale: AppLocale;
  readonly text: string;
  readonly autosave: boolean;
  readonly onSaveAction: (next: LocalizedString) => void;
  readonly setDraft: React.Dispatch<React.SetStateAction<LocalizedString>>;
}): void {
  const { draft, locale, text, autosave, onSaveAction, setDraft } = params;
  const next = setLocalizedString(draft, locale, text);
  setDraft(next);
  if (autosave) {
    onSaveAction(next);
  }
}

function computeFieldConfigs(draft: LocalizedString, requiredSet: Set<AppLocale>, uiLocale: string) {
  return ALLOWED_LOCALES.map(locale => ({
    locale,
    isLocaleRequired: requiredSet.has(locale),
    fieldValue: draft[locale] ?? "",
    isRtl: locale === "ar",
    languageName: getLanguageDisplayName(locale, uiLocale),
    emoji: getLanguageEmoji(locale),
  }));
}

function computeShowError(isLocaleRequired: boolean, fieldValue: string): boolean {
  return isLocaleRequired && !(typeof fieldValue === "string" && fieldValue.trim() !== "");
}

type LocaleFieldProps = {
  readonly locale: AppLocale;
  readonly fieldValue: string;
  readonly isLocaleRequired: boolean;
  readonly isRtl: boolean;
  readonly languageName: string;
  readonly emoji: string;
  readonly showError: boolean;
  readonly multiline: boolean | undefined;
  readonly minRows: number | undefined;
  readonly disabled: boolean;
  readonly onChange: (locale: AppLocale, text: string) => void;
  readonly t: LocalizedStringLabels;
};

const LocaleField: React.FC<LocaleFieldProps> = ({
  locale,
  fieldValue,
  isLocaleRequired,
  isRtl,
  languageName,
  emoji,
  showError,
  multiline,
  minRows,
  disabled,
  onChange,
  t,
}) => (
  <TextField
    key={locale}
    label={
      multiline ? (
        <>
          <LocaleEmoji emoji={emoji} sx={{ marginInlineEnd: 0.5 }} />
          {languageName}
          {isLocaleRequired ? " *" : ""}
        </>
      ) : (
        `${languageName}${isLocaleRequired ? " *" : ""}`
      )
    }
    value={fieldValue}
    onChange={event => onChange(locale, event.target.value)}
    multiline={multiline}
    minRows={minRows}
    error={showError}
    helperText={showError ? t.localeRequiredEntry(languageName) : undefined}
    disabled={disabled}
    dir={isRtl ? "rtl" : "ltr"}
    slotProps={{
      inputLabel: { shrink: true },
      input: multiline
        ? undefined
        : {
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

type DrawerFooterProps = {
  readonly canSave: boolean;
  readonly saving: boolean;
  readonly onSaveAction: (next: LocalizedString) => void;
  readonly draft: LocalizedString;
  readonly onCancelAction: () => void;
  readonly t: LocalizedStringLabels;
};

const DrawerFooter: React.FC<DrawerFooterProps> = ({ canSave, saving, onSaveAction, draft, onCancelAction, t }) => {
  const buttonSx = useMemo(() => ({ flex: 1, minHeight: 48 }), []);
  return (
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
      <Button onClick={onCancelAction} disabled={saving} variant="text" sx={buttonSx}>
        {t.cancel}
      </Button>
      <Button variant="contained" disabled={!canSave} onClick={() => onSaveAction(draft)} sx={buttonSx}>
        {t.save}
      </Button>
    </DialogActions>
  );
};

const mobilePaperSx = {
  width: "100%",
  maxHeight: "85vh",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  display: "flex" as const,
  flexDirection: "column" as const,
};

export const LocalizedStringDrawerMobile: React.FC<LocalizedStringDrawerProps> = ({
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
}) => {
  const t = useAppTranslation().uiTranslations.localizedString;
  const uiLocale = useAppLocale();
  const [draft, setDraft] = useState<LocalizedString>(value);

  const showFooter = useMemo(() => showActions ?? !autosave, [showActions, autosave]);
  const resolvedRequired = useMemo(
    () => requiredLocales ?? (required ? [DEFAULT_CONTENT_LOCALE] : []),
    [requiredLocales, required]
  );

  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  const handleFieldChange = useCallback(
    (locale: AppLocale, text: string) => resolveFieldChange({ draft, locale, text, autosave, onSaveAction, setDraft }),
    [draft, autosave, onSaveAction]
  );

  const valid = hasRequiredLocalizedValue(draft, resolvedRequired);
  const canSave = valid && !saving;

  const handleDismiss = useCallback(
    () => resolveDismiss({ autosave, dismissAction, canSave, draft, onSaveAction, onCancelAction }),
    [autosave, dismissAction, canSave, draft, onSaveAction, onCancelAction]
  );

  const headerTitle = useMemo(() => title ?? t.editTranslations, [title, t]);
  const requiredSet = useMemo(() => new Set<AppLocale>(resolvedRequired), [resolvedRequired]);
  const helperText = useMemo(
    () => buildHelperText({ draft, required, resolvedRequired, uiLocale, t }),
    [draft, required, resolvedRequired, uiLocale, t]
  );
  const fieldConfigs = useMemo(() => computeFieldConfigs(draft, requiredSet, uiLocale), [draft, requiredSet, uiLocale]);

  return (
    <Drawer open={open} anchor="bottom" onClose={handleDismiss} slotProps={{ paper: { sx: mobilePaperSx } }}>
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexShrink: 0 }}
      >
        <Typography variant="h6" component="span">
          {headerTitle}
        </Typography>
        <IconButton onClick={handleDismiss} disabled={saving} size="small" aria-label={t.cancel}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent dividers sx={{ flex: 1, overflow: "auto" }}>
        <Stack sx={{ gap: 2.5 }}>
          {fieldConfigs.map(cfg => (
            <LocaleField
              key={cfg.locale}
              locale={cfg.locale}
              fieldValue={cfg.fieldValue}
              isLocaleRequired={cfg.isLocaleRequired}
              isRtl={cfg.isRtl}
              languageName={cfg.languageName}
              emoji={cfg.emoji}
              showError={computeShowError(cfg.isLocaleRequired, cfg.fieldValue)}
              multiline={multiline}
              minRows={minRows}
              disabled={saving}
              onChange={handleFieldChange}
              t={t}
            />
          ))}
          {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
        </Stack>
      </DialogContent>
      {showFooter ? (
        <DrawerFooter
          canSave={canSave}
          saving={saving}
          onSaveAction={onSaveAction}
          draft={draft}
          onCancelAction={onCancelAction}
          t={t}
        />
      ) : null}
    </Drawer>
  );
};
