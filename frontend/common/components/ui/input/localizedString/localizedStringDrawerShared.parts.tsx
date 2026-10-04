"use client";

import { Button, DialogActions, FormHelperText, InputAdornment, Stack, TextField } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import {
  computeShowError,
  type LocaleFieldConfig,
} from "@/frontend/common/components/ui/input/localizedString/localizedStringDrawerShared.helpers";
import type { LocaleEmojiComponentProps } from "@/frontend/common/components/ui/input/localizedString/localizedStringDrawerShared.types";
import type { AppLocale, LocalizedStringLabels } from "@/shared/locale";
import type { LocalizedString } from "@/shared/types/localized-string";

type RenderFieldLabelParams = {
  readonly languageName: string;
  readonly isLocaleRequired: boolean;
  readonly multiline: boolean | undefined;
  readonly emoji: string;
  readonly LocaleEmoji: React.ComponentType<LocaleEmojiComponentProps>;
};

function renderFieldLabel({
  languageName,
  isLocaleRequired,
  multiline,
  emoji,
  LocaleEmoji,
}: RenderFieldLabelParams): ReactNode {
  const requiredIndicator = isLocaleRequired ? " *" : "";
  if (multiline) {
    return (
      <>
        <LocaleEmoji emoji={emoji} sx={{ marginInlineEnd: 0.5 }} />
        {languageName}
        {requiredIndicator}
      </>
    );
  }
  return <>{`${languageName}${requiredIndicator}`}</>;
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
  readonly LocaleEmoji: React.ComponentType<LocaleEmojiComponentProps>;
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
  LocaleEmoji,
}) => (
  <TextField
    key={locale}
    label={renderFieldLabel({ languageName, isLocaleRequired, multiline, emoji, LocaleEmoji })}
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

type LocalizedStringFieldStackProps = {
  readonly fieldConfigs: readonly LocaleFieldConfig[];
  readonly multiline: boolean | undefined;
  readonly minRows: number | undefined;
  readonly disabled: boolean;
  readonly onChange: (locale: AppLocale, text: string) => void;
  readonly t: LocalizedStringLabels;
  readonly LocaleEmoji: React.ComponentType<LocaleEmojiComponentProps>;
  readonly helperText: string | undefined;
};

export const LocalizedStringFieldStack: React.FC<LocalizedStringFieldStackProps> = ({
  fieldConfigs,
  multiline,
  minRows,
  disabled,
  onChange,
  t,
  LocaleEmoji,
  helperText,
}) => (
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
        disabled={disabled}
        onChange={onChange}
        t={t}
        LocaleEmoji={LocaleEmoji}
      />
    ))}
    {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
  </Stack>
);

type DrawerFooterProps = {
  readonly canSave: boolean;
  readonly saving: boolean;
  readonly onSaveAction: (next: LocalizedString) => void;
  readonly draft: LocalizedString;
  readonly onCancelAction: () => void;
  readonly t: LocalizedStringLabels;
  readonly footerButtonSx?: SxProps<Theme>;
};

export const DrawerFooter: React.FC<DrawerFooterProps> = ({
  canSave,
  saving,
  onSaveAction,
  draft,
  onCancelAction,
  t,
  footerButtonSx,
}) => {
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
      <Button onClick={onCancelAction} disabled={saving} variant="text" sx={footerButtonSx}>
        {t.cancel}
      </Button>
      <Button variant="contained" disabled={!canSave} onClick={() => onSaveAction(draft)} sx={footerButtonSx}>
        {t.save}
      </Button>
    </DialogActions>
  );
};
