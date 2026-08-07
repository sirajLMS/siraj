"use client";

import Box from "@mui/material/Box";
import type * as React from "react";
import { CountryAutocomplete } from "@/frontend/common/components/ui/input/countrySelect/CountryAutocomplete";
import type { CountryType } from "@/frontend/common/lib/locale";
import { Translation, useAppTranslation } from "@/shared/locale";

export type PhoneCountryPickerProps = {
  readonly country?: CountryType;
  readonly onSelectAction: (country: CountryType) => void;
};

/**
 * Attached country picker for PhoneInput — input and list share width and left edge.
 */
export const PhoneCountryPicker: React.FC<PhoneCountryPickerProps> = ({
  country,
  onSelectAction,
}: PhoneCountryPickerProps): React.ReactNode => {
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
      <CountryAutocomplete
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
