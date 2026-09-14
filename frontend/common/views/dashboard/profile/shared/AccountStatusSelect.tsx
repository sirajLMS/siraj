"use client";

import { MenuItem, TextField } from "@mui/material";
import { type Control, Controller, type FieldPath, type FieldValues, type UseFormRegister } from "react-hook-form";
import type { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";

export type AccountStatusOption<TValue extends string = AccountStatus> = {
  readonly value: TValue;
  readonly label: string;
};

type AccountStatusSelectBaseProps<TValue extends string = AccountStatus> = {
  readonly label: string;
  readonly options: readonly AccountStatusOption<TValue>[];
};

type RegisteredAccountStatusSelectProps<
  TFormValues extends FieldValues,
  TValue extends string = AccountStatus,
> = AccountStatusSelectBaseProps<TValue> & {
  readonly name: FieldPath<TFormValues>;
  readonly register: UseFormRegister<TFormValues>;
};

type ControlledAccountStatusSelectProps<
  TFormValues extends FieldValues,
  TValue extends string = AccountStatus,
> = AccountStatusSelectBaseProps<TValue> & {
  readonly name: FieldPath<TFormValues>;
  readonly control: Control<TFormValues>;
};

type UncontrolledAccountStatusSelectProps<TValue extends string = AccountStatus> =
  AccountStatusSelectBaseProps<TValue> & {
    readonly defaultValue: TValue;
  };

type AccountStatusSelectProps<TValue extends string = AccountStatus, TFormValues extends FieldValues = FieldValues> =
  | RegisteredAccountStatusSelectProps<TFormValues, TValue>
  | ControlledAccountStatusSelectProps<TFormValues, TValue>
  | UncontrolledAccountStatusSelectProps<TValue>;

/**
 * Shared account-status picker (TextField select with the Activated/Deactivated
 * MenuItems) used by the profile admin sections. Supports three bindings:
 * `register` (react-hook-form registration), `control` (react-hook-form
 * Controller), or `defaultValue` (uncontrolled display-only usage).
 */
export function AccountStatusSelect<
  TValue extends string = AccountStatus,
  TFormValues extends FieldValues = FieldValues,
>(props: AccountStatusSelectProps<TValue, TFormValues>) {
  const menuItems = props.options.map(option => (
    <MenuItem key={option.value} value={option.value}>
      {option.label}
    </MenuItem>
  ));

  if ("control" in props) {
    return (
      <Controller
        name={props.name}
        control={props.control}
        render={({ field }) => (
          <TextField {...field} label={props.label} fullWidth size="small" select>
            {menuItems}
          </TextField>
        )}
      />
    );
  }

  if ("register" in props) {
    return (
      <TextField label={props.label} fullWidth size="small" select {...props.register(props.name)}>
        {menuItems}
      </TextField>
    );
  }

  return (
    <TextField label={props.label} fullWidth size="small" select defaultValue={props.defaultValue}>
      {menuItems}
    </TextField>
  );
}
