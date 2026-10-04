"use client";

import { EditOutlined } from "@mui/icons-material";
import { Button, FormHelperText, TextField } from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import type { SxProps, Theme } from "@mui/material/styles";
import { TooltipIconButton } from "@/frontend/common/components/ui";
import type {
  LocaleAdornmentSwitchProps,
  LocalizedStringDrawerProps,
} from "@/frontend/common/components/ui/input/localizedString/types";
import type { LocalizedStringInputState } from "@/frontend/common/hooks/useLocalizedStringInputState";
import type { AppLocale, LocalizedStringLabels } from "@/shared/locale";

type EditDrawerControlProps = {
  readonly t: LocalizedStringLabels;
  readonly isCompact: boolean;
  readonly disabled: boolean;
  readonly onOpen: () => void;
};

const EditDrawerControl: React.FC<EditDrawerControlProps> = ({ t, isCompact, disabled, onOpen }) => {
  if (isCompact) {
    return (
      <TooltipIconButton
        label={t.editTranslations}
        onClick={onOpen}
        disabled={disabled}
        size="small"
        icon={<EditOutlined fontSize="small" />}
        sx={{ flexShrink: 0 }}
      />
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

type LocalizedStringInputFieldProps = {
  readonly t: LocalizedStringLabels;
  readonly label: string | undefined;
  readonly fieldValue: string;
  readonly onFieldChange: (text: string) => void;
  readonly onBlurAction: (() => void) | undefined;
  readonly required: boolean;
  readonly disabled: boolean;
  readonly showInlineError: boolean;
  readonly multiline: boolean | undefined;
  readonly minRows: number | undefined;
  readonly fullWidth: boolean;
  readonly size: "small" | "medium" | undefined;
  readonly isRtl: boolean;
  readonly activeLocale: AppLocale;
  readonly compact: boolean;
  readonly textFieldSuccessSx: SxProps<Theme> | undefined;
  readonly adornmentTopSx: { alignSelf: string; height: string; marginTop: number } | undefined;
  readonly LocaleAdornmentSwitch: React.ComponentType<LocaleAdornmentSwitchProps>;
  readonly onLocaleSwitch: (next: AppLocale) => void;
  readonly successSwitch: boolean;
  readonly disableDrawer: boolean;
  readonly onOpenDrawer: () => void;
};

const LocalizedStringInputField: React.FC<LocalizedStringInputFieldProps> = ({
  t,
  label,
  fieldValue,
  onFieldChange,
  onBlurAction,
  required,
  disabled,
  showInlineError,
  multiline,
  minRows,
  fullWidth,
  size,
  isRtl,
  activeLocale,
  compact,
  textFieldSuccessSx,
  adornmentTopSx,
  LocaleAdornmentSwitch,
  onLocaleSwitch,
  successSwitch,
  disableDrawer,
  onOpenDrawer,
}) => (
  <TextField
    label={label}
    value={fieldValue}
    onChange={event => onFieldChange(event.target.value)}
    onBlur={onBlurAction}
    required={required}
    disabled={disabled}
    error={showInlineError}
    multiline={multiline}
    minRows={minRows}
    fullWidth={fullWidth}
    size={size}
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
              onChangeAction={onLocaleSwitch}
              disabled={disabled}
              compact={compact}
              successSwitch={successSwitch}
            />
          </InputAdornment>
        ),
        endAdornment: disableDrawer ? undefined : (
          <InputAdornment position="end" sx={adornmentTopSx}>
            <EditDrawerControl t={t} isCompact={compact} disabled={disabled} onOpen={onOpenDrawer} />
          </InputAdornment>
        ),
      },
      htmlInput: { dir: isRtl ? "rtl" : "ltr" },
    }}
  />
);

type LocalizedStringInputSharedViewProps = {
  readonly t: LocalizedStringLabels;
  readonly state: LocalizedStringInputState;
  readonly label: string | undefined;
  readonly required: boolean;
  readonly onBlurAction: (() => void) | undefined;
  readonly disabled: boolean;
  readonly multiline: boolean | undefined;
  readonly minRows: number | undefined;
  readonly fullWidth: boolean;
  readonly textFieldSize: "small" | "medium" | undefined;
  readonly disableDrawer: boolean;
  readonly LocaleAdornmentSwitch: React.ComponentType<LocaleAdornmentSwitchProps>;
  readonly LocalizedStringDrawer: React.ComponentType<LocalizedStringDrawerProps>;
  readonly drawerAutosave: boolean;
  readonly drawerShowActions: boolean | undefined;
  readonly drawerDismissAction: "save" | "cancel";
};

export const LocalizedStringInputSharedView: React.FC<LocalizedStringInputSharedViewProps> = ({
  t,
  state,
  label,
  required,
  onBlurAction,
  disabled,
  multiline,
  minRows,
  fullWidth,
  textFieldSize,
  disableDrawer,
  LocaleAdornmentSwitch,
  LocalizedStringDrawer,
  drawerAutosave,
  drawerShowActions,
  drawerDismissAction,
}) => (
  <>
    <LocalizedStringInputField
      t={t}
      label={label}
      fieldValue={state.fieldValue}
      onFieldChange={state.handleFieldChange}
      onBlurAction={onBlurAction}
      required={required}
      disabled={disabled}
      showInlineError={state.showInlineError}
      multiline={multiline}
      minRows={minRows}
      fullWidth={fullWidth}
      size={textFieldSize}
      isRtl={state.isRtl}
      activeLocale={state.activeLocale}
      compact={state.isCompact}
      textFieldSuccessSx={state.textFieldSuccessSx}
      adornmentTopSx={state.adornmentTopSx}
      LocaleAdornmentSwitch={LocaleAdornmentSwitch}
      onLocaleSwitch={state.handleLocaleSwitch}
      successSwitch={state.successSwitch}
      disableDrawer={disableDrawer}
      onOpenDrawer={() => state.setDrawerOpen(true)}
    />
    {state.inlineHelperText ? (
      <FormHelperText error={state.showInlineError}>{state.inlineHelperText}</FormHelperText>
    ) : null}
    <LocalizedStringDrawer
      open={state.drawerOpen}
      value={state.draft}
      title={state.drawerResolvedTitle}
      multiline={multiline}
      minRows={minRows}
      required={required}
      requiredLocales={state.resolvedRequiredLocales}
      onSaveAction={state.handleDrawerSave}
      onCancelAction={state.handleDrawerCancel}
      autosave={drawerAutosave}
      showActions={drawerShowActions}
      dismissAction={drawerDismissAction}
      saving={false}
    />
  </>
);
