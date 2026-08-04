"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type CountryType, getCountryByCode } from "@/frontend/common/lib/locale";
import {
  buildE164FromParts,
  canAppendCallingCodeDigit,
  clampSelectionToDigits,
  formatNationalDigits,
  getCallingCodeForRegion,
  getMaxCallingCodeLength,
  getNextFormatChar,
  isCallingCodeComplete,
  isCallingCodePrefixValid,
  isCompletePhoneValid,
  matchCallingCodeFromDigits,
  splitPhoneValueToParts,
} from "@/shared/lib/phone";

export type PhoneInputSlot = "prefix" | "national";

export type UsePhoneInputOptions = {
  readonly value: string | null;
  readonly onChangeAction: (e164: string | null) => void;
  readonly defaultRegion?: string;
  // NEW FOR PLAN v5: country-picker open state lifted out of tier PhoneInput renderers
  //   so tier .tsx files no longer need useState/useCallback for popover handling (§3 N6/N7/N9 fix).
  readonly disabled?: boolean;
};

export type UsePhoneInputResult = {
  readonly country: CountryType | undefined;
  readonly prefixDigits: string;
  readonly nationalDigits: string;
  readonly nationalDisplay: string;
  readonly activeSlot: PhoneInputSlot;
  readonly prefixInvalid: boolean;
  readonly phoneInvalid: boolean;
  readonly isValid: boolean;
  readonly setActiveSlot: (slot: PhoneInputSlot) => void;
  readonly selectCountry: (country: CountryType) => void;
  readonly handlePrefixKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  readonly handleNationalKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  readonly handleNationalSelect: (event: React.SyntheticEvent<HTMLInputElement>) => void;
  readonly resetPrefixDisplay: (event: React.SyntheticEvent<HTMLInputElement>) => void;
  readonly resetNationalDisplay: (event: React.SyntheticEvent<HTMLInputElement>) => void;
  readonly onNationalInput: (event: React.SyntheticEvent<HTMLInputElement>) => void;
  readonly handleNationalChange: (filledValue: string) => void;
  readonly prefixInputRef: React.RefObject<HTMLInputElement | null>;
  readonly nationalInputRef: React.RefObject<HTMLInputElement | null>;
  readonly maxPrefixDisplayLength: number;
  // NEW FOR PLAN v5: country-picker state lifted out of tier (§3 N6/N7/N9 fix).
  readonly countryPickerOpen: boolean;
  readonly openCountryPicker: (event: React.MouseEvent<HTMLElement>) => void;
  readonly closeCountryPicker: () => void;
  readonly handleCountrySelect: (country: CountryType) => void;
};

function resolveCountry(region: string | null | undefined): CountryType | undefined {
  if (!region) {
    return undefined;
  }
  return getCountryByCode(region);
}

function buildEmittedValue(prefixDigits: string, nationalDigits: string): string | null {
  if (!prefixDigits && !nationalDigits) {
    return null;
  }
  const built = buildE164FromParts(prefixDigits, nationalDigits);
  if (built) {
    return built;
  }
  if (prefixDigits) {
    return `+${prefixDigits}${nationalDigits}`;
  }
  return null;
}

function usePhoneStateSync(
  value: string | null,
  defaultRegion: string,
  lastEmittedRef: React.RefObject<string | null | undefined>,
  setRegion: (region: string | null) => void,
  setPrefixDigits: (digits: string) => void,
  setNationalDigits: (digits: string) => void
): void {
  useEffect(() => {
    if (lastEmittedRef.current !== undefined && value === lastEmittedRef.current) {
      return;
    }
    lastEmittedRef.current = value;
    const parts = splitPhoneValueToParts(value, defaultRegion);
    setRegion(parts.prefixDigits ? (parts.region ?? defaultRegion) : null);
    setPrefixDigits(parts.prefixDigits);
    setNationalDigits(parts.nationalDigits);
  }, [value, defaultRegion, lastEmittedRef, setRegion, setPrefixDigits, setNationalDigits]);
}

function useFocusSlot(
  prefixInputRef: React.RefObject<HTMLInputElement | null>,
  nationalInputRef: React.RefObject<HTMLInputElement | null>,
  setActiveSlot: (slot: PhoneInputSlot) => void
): {
  readonly focusPrefix: () => void;
  readonly focusNational: () => void;
} {
  const focusPrefix = useCallback(() => {
    setActiveSlot("prefix");
    prefixInputRef.current?.focus();
  }, [prefixInputRef, setActiveSlot]);

  const focusNational = useCallback(() => {
    setActiveSlot("national");
    nationalInputRef.current?.focus();
  }, [nationalInputRef, setActiveSlot]);

  return { focusPrefix, focusNational };
}

function usePrefixUpdate(
  region: string | null,
  nationalDigits: string,
  defaultRegion: string,
  setPrefixDigits: (digits: string) => void,
  setRegion: (region: string | null) => void,
  emitChange: (prefixDigits: string, nationalDigits: string) => void
): (nextPrefix: string) => void {
  return useCallback(
    (nextPrefix: string) => {
      setPrefixDigits(nextPrefix);
      if (!nextPrefix) {
        setRegion(null);
        emitChange(nextPrefix, nationalDigits);
        return;
      }
      const match = matchCallingCodeFromDigits(nextPrefix, region ?? defaultRegion);
      if (match) {
        setRegion(match.region);
      }
      emitChange(nextPrefix, nationalDigits);
    },
    [region, nationalDigits, defaultRegion, setPrefixDigits, setRegion, emitChange]
  );
}

function usePrefixKeyDown(
  prefixDigits: string,
  updateFromPrefix: (nextPrefix: string) => void,
  focusNational: () => void
): (event: React.KeyboardEvent<HTMLInputElement>) => void {
  return useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Backspace") {
        event.preventDefault();
        if (prefixDigits.length === 0) {
          return;
        }
        updateFromPrefix(prefixDigits.slice(0, -1));
        return;
      }

      if (event.key === "ArrowRight" && isCallingCodeComplete(prefixDigits)) {
        event.preventDefault();
        focusNational();
        return;
      }

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        if (!canAppendCallingCodeDigit(prefixDigits, event.key)) {
          return;
        }
        updateFromPrefix(`${prefixDigits}${event.key}`);
      }
    },
    [prefixDigits, updateFromPrefix, focusNational]
  );
}

type NationalKeyDownState = {
  readonly prefixDigits: string;
  readonly nationalDigits: string;
  readonly region: string | null;
  readonly defaultRegion: string;
  readonly nationalDisplay: string;
};

function useNationalKeyDown(
  state: NationalKeyDownState,
  setNationalDigits: (digits: string) => void,
  emitChange: (prefixDigits: string, nationalDigits: string) => void,
  focusPrefix: () => void
): (event: React.KeyboardEvent<HTMLInputElement>) => void {
  const { prefixDigits, nationalDigits, region, defaultRegion, nationalDisplay } = state;
  return useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Backspace") {
        event.preventDefault();
        if (nationalDigits.length > 0) {
          const nextNational = nationalDigits.slice(0, -1);
          setNationalDigits(nextNational);
          emitChange(prefixDigits, nextNational);
          return;
        }
        focusPrefix();
        return;
      }

      if (event.key === "ArrowLeft" && nationalDigits.length === 0) {
        event.preventDefault();
        focusPrefix();
        return;
      }

      const nextFormatChar = getNextFormatChar(nationalDisplay, nationalDigits, region ?? defaultRegion);
      if (nextFormatChar && event.key === nextFormatChar) {
        event.preventDefault();
        return;
      }

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        const nextNational = `${nationalDigits}${event.key}`;
        setNationalDigits(nextNational);
        emitChange(prefixDigits, nextNational);
      }
    },
    [prefixDigits, nationalDigits, region, defaultRegion, nationalDisplay, setNationalDigits, emitChange, focusPrefix]
  );
}

function useDerivedPhoneState(
  region: string | null,
  prefixDigits: string,
  nationalDigits: string,
  defaultRegion: string
): {
  readonly country: CountryType | undefined;
  readonly nationalDisplay: string;
  readonly prefixInvalid: boolean;
  readonly phoneInvalid: boolean;
  readonly isValid: boolean;
} {
  const country = useMemo(() => (prefixDigits ? resolveCountry(region) : undefined), [prefixDigits, region]);
  const nationalDisplay = useMemo(
    () => formatNationalDigits(nationalDigits, region ?? defaultRegion),
    [nationalDigits, region, defaultRegion]
  );
  const prefixInvalid = prefixDigits.length > 0 && !isCallingCodePrefixValid(prefixDigits);
  const hasInput = prefixDigits.length > 0 || nationalDigits.length > 0;
  const isValid = isCompletePhoneValid(prefixDigits, nationalDigits, region, defaultRegion);
  const phoneInvalid = hasInput && !prefixInvalid && !isValid;

  return { country, nationalDisplay, prefixInvalid, phoneInvalid, isValid };
}

function useSelectCountry(
  nationalDigits: string,
  setRegion: (region: string | null) => void,
  setPrefixDigits: (digits: string) => void,
  emitChange: (prefixDigits: string, nationalDigits: string) => void,
  focusPrefix: () => void
): (nextCountry: CountryType) => void {
  return useCallback(
    (nextCountry: CountryType) => {
      const nextPrefix = nextCountry.phone;
      setRegion(nextCountry.code);
      setPrefixDigits(nextPrefix);
      emitChange(nextPrefix, nationalDigits);
      focusPrefix();
    },
    [nationalDigits, setRegion, setPrefixDigits, emitChange, focusPrefix]
  );
}

function useNationalSelect(nationalDisplay: string): (event: React.SyntheticEvent<HTMLInputElement>) => void {
  return useCallback(
    (event: React.SyntheticEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      if (start === end) {
        return;
      }
      const clamped = clampSelectionToDigits(nationalDisplay, start, end);
      input.setSelectionRange(clamped.start, clamped.end);
    },
    [nationalDisplay]
  );
}

function useResetHandlers(
  prefixDigits: string,
  nationalDisplay: string
): {
  readonly resetPrefixDisplay: (event: React.SyntheticEvent<HTMLInputElement>) => void;
  readonly resetNationalDisplay: (event: React.SyntheticEvent<HTMLInputElement>) => void;
} {
  const resetPrefixDisplay = useCallback(
    (event: React.SyntheticEvent<HTMLInputElement>) => {
      event.currentTarget.value = `+${prefixDigits}`;
    },
    [prefixDigits]
  );

  const resetNationalDisplay = useCallback(
    (event: React.SyntheticEvent<HTMLInputElement>) => {
      event.currentTarget.value = nationalDisplay;
    },
    [nationalDisplay]
  );

  return { resetPrefixDisplay, resetNationalDisplay };
}

type PhoneInputState = {
  readonly prefixInputRef: React.RefObject<HTMLInputElement | null>;
  readonly nationalInputRef: React.RefObject<HTMLInputElement | null>;
  readonly lastEmittedRef: React.RefObject<string | null | undefined>;
  readonly activeSlot: PhoneInputSlot;
  readonly setActiveSlot: (slot: PhoneInputSlot) => void;
  readonly region: string | null;
  readonly setRegion: (region: string | null) => void;
  readonly prefixDigits: string;
  readonly setPrefixDigits: (digits: string) => void;
  readonly nationalDigits: string;
  readonly setNationalDigits: (digits: string) => void;
};

function usePhoneInputState(value: string | null, defaultRegion: string): PhoneInputState {
  const prefixInputRef = useRef<HTMLInputElement>(null);
  const nationalInputRef = useRef<HTMLInputElement>(null);
  const lastEmittedRef = useRef<string | null | undefined>(undefined);
  const [activeSlot, setActiveSlot] = useState<PhoneInputSlot>("prefix");

  const initialParts = useMemo(() => splitPhoneValueToParts(value, defaultRegion), [value, defaultRegion]);
  const [region, setRegion] = useState<string | null>(
    initialParts.prefixDigits ? (initialParts.region ?? defaultRegion) : null
  );
  const [prefixDigits, setPrefixDigits] = useState(initialParts.prefixDigits);
  const [nationalDigits, setNationalDigits] = useState(initialParts.nationalDigits);

  return {
    prefixInputRef,
    nationalInputRef,
    lastEmittedRef,
    activeSlot,
    setActiveSlot,
    region,
    setRegion,
    prefixDigits,
    setPrefixDigits,
    nationalDigits,
    setNationalDigits,
  };
}

function useEmitChange(
  onChangeAction: (e164: string | null) => void,
  lastEmittedRef: React.RefObject<string | null | undefined>
): (prefixDigits: string, nationalDigits: string) => void {
  return useCallback(
    (nextPrefixDigits: string, nextNationalDigits: string) => {
      const emitted = buildEmittedValue(nextPrefixDigits, nextNationalDigits);
      lastEmittedRef.current = emitted;
      onChangeAction(emitted);
    },
    [onChangeAction, lastEmittedRef]
  );
}

type PhoneInputHandlers = {
  readonly selectCountry: (country: CountryType) => void;
  readonly handlePrefixKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  readonly handleNationalKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  readonly handleNationalSelect: (event: React.SyntheticEvent<HTMLInputElement>) => void;
  readonly resetPrefixDisplay: (event: React.SyntheticEvent<HTMLInputElement>) => void;
  readonly resetNationalDisplay: (event: React.SyntheticEvent<HTMLInputElement>) => void;
  readonly onNationalInput: (event: React.SyntheticEvent<HTMLInputElement>) => void;
  readonly handleNationalChange: (filledValue: string) => void;
};

type NationalChangeDeps = {
  readonly defaultRegion: string;
  readonly emitChange: (prefixDigits: string, nationalDigits: string) => void;
  readonly state: PhoneInputState;
};

function useNationalChange({ defaultRegion, emitChange, state }: NationalChangeDeps) {
  return useCallback(
    (filledValue: string) => {
      const trimmed = filledValue.trim();
      if (!trimmed) {
        state.setPrefixDigits("");
        state.setNationalDigits("");
        state.setRegion(defaultRegion);
        emitChange("", "");
        return;
      }
      const parts = splitPhoneValueToParts(trimmed, defaultRegion);
      state.setPrefixDigits(parts.prefixDigits);
      state.setNationalDigits(parts.nationalDigits);
      if (parts.region) {
        state.setRegion(parts.region);
      }
      emitChange(parts.prefixDigits, parts.nationalDigits);
    },
    [defaultRegion, emitChange, state]
  );
}

type NationalInputDeps = {
  readonly nationalDisplay: string;
  readonly handleNationalChange: (filledValue: string) => void;
  readonly resetNationalDisplay: (event: React.SyntheticEvent<HTMLInputElement>) => void;
};

function useNationalInput({ nationalDisplay, handleNationalChange, resetNationalDisplay }: NationalInputDeps) {
  return useCallback(
    (event: React.SyntheticEvent<HTMLInputElement>) => {
      const target = event.currentTarget;
      const newValue = target.value;
      const inputEvent = event.nativeEvent as InputEvent;
      const inputType = inputEvent?.inputType;

      // Detect programmatic fill (Playwright .fill()) vs normal keystroke.
      // A single keystroke changes length by at most 1 and uses insertText.
      // A fill inserts multiple chars and has no inputType (or insertFromPaste).
      const isProgrammaticFill =
        Math.abs(newValue.length - nationalDisplay.length) > 1 || inputType === "insertFromPaste";

      if (isProgrammaticFill && newValue !== nationalDisplay) {
        handleNationalChange(newValue);
        return;
      }

      resetNationalDisplay(event);
    },
    [handleNationalChange, nationalDisplay, resetNationalDisplay]
  );
}

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
  const handlePrefixKeyDown = usePrefixKeyDown(prefixDigits, updateFromPrefix, focusNational);
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

  // NEW FOR PLAN v5: country-picker open state lifted out of tier PhoneInput renderers
  //   so tier .tsx files no longer need useState/useCallback for popover handling (§3 N6/N7/N9 fix).
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
    // NEW FOR PLAN v5: lifted country-picker state (§3 N6/N7/N9 fix).
    countryPickerOpen,
    openCountryPicker,
    closeCountryPicker,
    handleCountrySelect,
  };
}

export function getDefaultCountryForRegion(region: string): CountryType | undefined {
  const callingCode = getCallingCodeForRegion(region);
  const match = matchCallingCodeFromDigits(callingCode, region);
  if (!match) {
    return getCountryByCode(region);
  }
  return getCountryByCode(match.region);
}
