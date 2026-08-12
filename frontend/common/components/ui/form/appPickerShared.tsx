"use client";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import type { PickersInputLocaleText } from "@mui/x-date-pickers/locales";
import { ar } from "date-fns/locale/ar";
import type * as React from "react";
import { useAppLocale } from "@/frontend/common/providers/localeContext";

type PickerComponentProps = { readonly [key: string]: unknown };

type PickerComponentType<P extends PickerComponentProps = PickerComponentProps> = React.FC<P>;

type AppPickerSharedProps<P extends PickerComponentProps = PickerComponentProps> = {
  readonly props: P;
  readonly PickerComponent: PickerComponentType<P>;
  readonly arabicLocaleText: PickersInputLocaleText;
};

export function AppPickerShared<P extends PickerComponentProps>({
  props,
  PickerComponent,
  arabicLocaleText,
}: AppPickerSharedProps<P>): React.ReactNode {
  const locale = useAppLocale();
  const isArabicLocale = locale === "ar";

  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={isArabicLocale ? ar : undefined}
      localeText={isArabicLocale ? arabicLocaleText : undefined}
    >
      <PickerComponent {...props} />
    </LocalizationProvider>
  );
}
