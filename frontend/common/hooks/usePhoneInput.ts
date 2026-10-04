"use client";

import { useCallback, useState } from "react";
import {
  useNationalChange,
  useNationalInput,
  useNationalKeyDown,
  useNationalSelect,
  usePrefixKeyDown,
  usePrefixUpdate,
  useResetHandlers,
  useSelectCountry,
} from "@/frontend/common/hooks/usePhoneInput.handlers.hooks";
import {
  useDerivedPhoneState,
  useEmitChange,
  useFocusSlot,
  usePhoneInputState,
  usePhoneStateSync,
} from "@/frontend/common/hooks/usePhoneInput.hooks";
import type {
  PhoneInputHandlers,
  PhoneInputState,
  UsePhoneInputOptions,
  UsePhoneInputResult,
} from "@/frontend/common/hooks/usePhoneInput.types";
import type { CountryType } from "@/frontend/common/lib/locale";
import { getMaxCallingCodeLength } from "@/shared/lib/phone";

export type {
  UsePhoneInputOptions,
  UsePhoneInputResult,
} from "@/frontend/common/hooks/usePhoneInput.types";

function usePhoneInputHandlers(
  state: PhoneInputState,
  derived: { readonly nationalDisplay: string },
  defaultRegion: string,
  onChangeAction: (e164: string | null) => void
): PhoneInputHandlers {
  const { region, prefixDigits, nationalDigits } = state;
  const { nationalDisplay } = derived;
  const emitChange = useEmitChange(onChangeAction, state.lastEmittedRef);

  const { focusPrefix, focusNational } = useFocusSlot(
    state.prefixInputRef,
    state.nationalInputRef,
    state.setActiveSlot
  );
  const updateFromPrefix = usePrefixUpdate(
    region,
    nationalDigits,
    defaultRegion,
    state.setPrefixDigits,
    state.setRegion,
    emitChange
  );
  const selectCountry = useSelectCountry(
    nationalDigits,
    state.setRegion,
    state.setPrefixDigits,
    emitChange,
    focusPrefix
  );
  const handlePrefixKeyDown = usePrefixKeyDown(
    { prefixDigits, nationalDigits },
    updateFromPrefix,
    state.setNationalDigits,
    emitChange,
    focusNational
  );
  const handleNationalKeyDown = useNationalKeyDown(
    { prefixDigits, nationalDigits, region, defaultRegion, nationalDisplay },
    state.setNationalDigits,
    emitChange,
    focusPrefix
  );
  const handleNationalSelect = useNationalSelect(nationalDisplay);
  const { resetPrefixDisplay, resetNationalDisplay } = useResetHandlers(prefixDigits, nationalDisplay);
  const handleNationalChange = useNationalChange({ defaultRegion, emitChange, state });
  const onNationalInput = useNationalInput({ nationalDisplay, handleNationalChange, resetNationalDisplay });

  return {
    selectCountry,
    handlePrefixKeyDown,
    handleNationalKeyDown,
    handleNationalSelect,
    resetPrefixDisplay,
    resetNationalDisplay,
    onNationalInput,
    handleNationalChange,
  };
}

export function usePhoneInput({
  value,
  onChangeAction,
  defaultRegion = "EG",
  disabled = false,
}: UsePhoneInputOptions): UsePhoneInputResult {
  const state = usePhoneInputState(value, defaultRegion);
  const { prefixDigits, nationalDigits, region, activeSlot } = state;

  usePhoneStateSync(
    value,
    defaultRegion,
    state.lastEmittedRef,
    state.setRegion,
    state.setPrefixDigits,
    state.setNationalDigits
  );

  const { country, nationalDisplay, prefixInvalid, phoneInvalid, isValid } = useDerivedPhoneState(
    region,
    prefixDigits,
    nationalDigits,
    defaultRegion
  );

  const handlers = usePhoneInputHandlers(state, { nationalDisplay }, defaultRegion, onChangeAction);

  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const openCountryPicker = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      if (disabled) {
        return;
      }
      setCountryPickerOpen(current => !current);
    },
    [disabled]
  );

  const closeCountryPicker = useCallback(() => {
    setCountryPickerOpen(false);
  }, []);

  const handleCountrySelect = useCallback(
    (nextCountry: CountryType) => {
      handlers.selectCountry(nextCountry);
      closeCountryPicker();
    },
    [closeCountryPicker, handlers]
  );

  return {
    country,
    prefixDigits,
    nationalDigits,
    nationalDisplay,
    activeSlot,
    prefixInvalid,
    phoneInvalid,
    isValid,
    setActiveSlot: state.setActiveSlot,
    ...handlers,
    prefixInputRef: state.prefixInputRef,
    nationalInputRef: state.nationalInputRef,
    maxPrefixDisplayLength: getMaxCallingCodeLength() + 1,
    countryPickerOpen,
    openCountryPicker,
    closeCountryPicker,
    handleCountrySelect,
  };
}
