"use client";

import Box from "@mui/material/Box";
import type * as React from "react";
import type { CountryType } from "@/frontend/common/lib/locale";
import { CountryAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/countrySelect";
import { Translation, useAppTranslation } from "@/shared/locale";

export type PhoneCountryPickerDesktopProps = {
  readonly country?: CountryType;
  readonly onSelectAction: (country: CountryType) => void;
};

/**
 * Desktop tier attached country picker for PhoneInputDesktop.
 * Composes the desktop-tier CountryAutocomplete variant; rendered attached beneath the phone TextField.
 */
export const PhoneCountryPickerDesktop: React.FC<PhoneCountryPickerDesktopProps> = ({
  country,
  onSelectAction,
}: PhoneCountryPickerDesktopProps): React.ReactNode => {
  const t = useAppTranslation(Translation.Ui.PhoneInput);

  return (
    <Box
      onMouseDown={event => event.preventDefault()}
      sx={{
        position: "absolute",
        top: "100%",
        insetInlineStart: 0,
        width: "100%",
        zIndex: theme => theme.zIndex.modal,
      }}
    >
      <CountryAutocompleteDesktop
        country={country}
        onChangeAction={onSelectAction}
        label={t.selectCountry}
        fullWidth
        open
        showPhonePrefix
        matchAnchorWidth
        listAttached
      />
    </Box>
  );
};
