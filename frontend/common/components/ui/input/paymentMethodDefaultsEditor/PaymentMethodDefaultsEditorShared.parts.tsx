"use client";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Button, InputAdornment, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import type { PaymentMethodDefaultsEditorSlots } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/PaymentMethodDefaultsEditorShared.types";
import type { LocalizedString } from "@/shared/types";

type DefaultMethodSelectProps = {
  readonly label: string;
  readonly value: string | null;
  readonly onChangeAction: (id: string | null) => void;
  readonly methods: readonly PaymentMethodRow[];
  readonly disabled: boolean;
  readonly noneLabel: string;
  readonly menuItemSelectedSx: SxProps<Theme> | undefined;
  readonly formatMethodLabel: (method: PaymentMethodRow) => string;
};

const DefaultMethodSelect: React.FC<DefaultMethodSelectProps> = ({
  label,
  value,
  onChangeAction,
  methods,
  disabled,
  noneLabel,
  menuItemSelectedSx,
  formatMethodLabel,
}) => (
  <TextField
    select
    label={label}
    fullWidth
    size="small"
    disabled={disabled}
    value={value ?? ""}
    onChange={event => onChangeAction(event.target.value || null)}
    sx={outlinedInputSx}
    slotProps={{ inputLabel: { shrink: true } }}
  >
    <MenuItem value="" sx={menuItemSelectedSx}>
      {noneLabel}
    </MenuItem>
    {methods.map(method => (
      <MenuItem key={method.id} value={method.id} sx={menuItemSelectedSx}>
        {formatMethodLabel(method)}
      </MenuItem>
    ))}
  </TextField>
);

type InstructionsFieldProps = {
  readonly label: string;
  readonly value: string;
  readonly disabled: boolean;
  readonly editButtonSize: "small" | "medium";
  readonly editLabel: string;
  readonly onOpen: () => void;
};

const InstructionsField: React.FC<InstructionsFieldProps> = ({
  label,
  value,
  disabled,
  editButtonSize,
  editLabel,
  onOpen,
}) => (
  <TextField
    label={label}
    fullWidth
    size="small"
    disabled={disabled}
    value={value}
    sx={outlinedInputSx}
    slotProps={{
      input: {
        readOnly: true,
        endAdornment: (
          <InputAdornment position="end">
            <Button
              variant="outlined"
              size={editButtonSize}
              disabled={disabled}
              startIcon={<EditOutlinedIcon />}
              onClick={onOpen}
            >
              {editLabel}
            </Button>
          </InputAdornment>
        ),
      },
    }}
  />
);

type MethodListProps = {
  readonly methods: readonly PaymentMethodRow[];
  readonly formatMethodLabel: (method: PaymentMethodRow) => string;
  readonly renderDefaultBadge: (label: string) => React.ReactNode;
  readonly defaultBadgeLabel: string;
  readonly spacing: number | undefined;
  readonly listStackSx: SxProps<Theme> | undefined;
};

export const MethodList: React.FC<MethodListProps> = ({
  methods,
  formatMethodLabel,
  renderDefaultBadge,
  defaultBadgeLabel,
  spacing,
  listStackSx,
}) => (
  <Stack spacing={spacing} sx={listStackSx}>
    {methods.map(method => (
      <Box
        key={method.id}
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 1.5,
          borderRadius: 1,
          border: `1px solid ${theme.palette.outlineVariant}`,
        })}
      >
        <Typography sx={{ flex: 1, typography: "bodyMd" }}>{formatMethodLabel(method)}</Typography>
        {method.isDefault ? renderDefaultBadge(defaultBadgeLabel) : null}
      </Box>
    ))}
  </Stack>
);

type DefaultMethodSelectsProps = {
  readonly payinLabel: string;
  readonly payoutLabel: string;
  readonly noneLabel: string;
  readonly payinDefaultId: string | null;
  readonly payoutDefaultId: string | null;
  readonly onPayinDefaultChangeAction: (id: string | null) => void;
  readonly onPayoutDefaultChangeAction: (id: string | null) => void;
  readonly payinMethods: readonly PaymentMethodRow[];
  readonly payoutMethods: readonly PaymentMethodRow[];
  readonly disabled: boolean;
  readonly menuItemSelectedSx: SxProps<Theme> | undefined;
  readonly formatMethodLabel: (method: PaymentMethodRow) => string;
};

export const DefaultMethodSelects: React.FC<DefaultMethodSelectsProps> = ({
  payinLabel,
  payoutLabel,
  noneLabel,
  payinDefaultId,
  payoutDefaultId,
  onPayinDefaultChangeAction,
  onPayoutDefaultChangeAction,
  payinMethods,
  payoutMethods,
  disabled,
  menuItemSelectedSx,
  formatMethodLabel,
}) => (
  <>
    <DefaultMethodSelect
      label={payinLabel}
      value={payinDefaultId}
      onChangeAction={onPayinDefaultChangeAction}
      methods={payinMethods}
      disabled={disabled}
      noneLabel={noneLabel}
      menuItemSelectedSx={menuItemSelectedSx}
      formatMethodLabel={formatMethodLabel}
    />
    <DefaultMethodSelect
      label={payoutLabel}
      value={payoutDefaultId}
      onChangeAction={onPayoutDefaultChangeAction}
      methods={payoutMethods}
      disabled={disabled}
      noneLabel={noneLabel}
      menuItemSelectedSx={menuItemSelectedSx}
      formatMethodLabel={formatMethodLabel}
    />
  </>
);

type InstructionsSectionProps = {
  readonly label: string;
  readonly editLabel: string;
  readonly displayValue: string;
  readonly instructions: LocalizedString;
  readonly disabled: boolean;
  readonly editButtonSize: "small" | "medium";
  readonly open: boolean;
  readonly LocalizedStringDrawer: PaymentMethodDefaultsEditorSlots["LocalizedStringDrawer"];
  readonly onOpenChange: (open: boolean) => void;
  readonly onSaveAction: (next: LocalizedString) => void;
};

export const InstructionsSection: React.FC<InstructionsSectionProps> = ({
  label,
  editLabel,
  displayValue,
  instructions,
  disabled,
  editButtonSize,
  open,
  LocalizedStringDrawer,
  onOpenChange,
  onSaveAction,
}) => (
  <>
    <InstructionsField
      label={label}
      value={displayValue}
      disabled={disabled}
      editButtonSize={editButtonSize}
      editLabel={editLabel}
      onOpen={() => onOpenChange(true)}
    />
    <LocalizedStringDrawer
      open={open}
      value={instructions}
      title={editLabel}
      multiline
      onSaveAction={next => {
        onSaveAction(next);
        onOpenChange(false);
      }}
      onCancelAction={() => onOpenChange(false)}
    />
  </>
);
