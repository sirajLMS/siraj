"use client";

import Box from "@mui/material/Box";
import type * as React from "react";
import type { CountryType } from "@/frontend/common/lib/locale";
import { CountryAutocompleteMobile } from "@/frontend/mobile/components/ui/input/countrySelect";
import { Translation, useAppTranslation } from "@/shared/locale";

export type PhoneCountryPickerMobileProps = {
  readonly country?: CountryType;
  readonly onSelectAction: (country: CountryType) => void;
};

/**
 * Mobile tier attached country picker for PhoneInputMobile.
 * Composes the mobile-tier CountryAutocomplete variant; input and list share width and left edge,
 * rendered attached beneath the phone TextField.
 */
export const PhoneCountryPickerMobile: React.FC<PhoneCountryPickerMobileProps> = ({
  country,
  onSelectAction,
}: PhoneCountryPickerMobileProps): React.ReactNode => {
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
      <CountryAutocompleteMobile
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
