"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type CountryType, getCountryByCode } from "@/frontend/lib/locale";
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
  readonly resetPrefixDisplay: (event: React.FormEvent<HTMLInputElement>) => void;
  readonly resetNationalDisplay: (event: React.FormEvent<HTMLInputElement>) => void;
  readonly prefixInputRef: React.RefObject<HTMLInputElement | null>;
  readonly nationalInputRef: React.RefObject<HTMLInputElement | null>;
  readonly maxPrefixDisplayLength: number;
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

export function usePhoneInput({
  value,
  onChangeAction,
  defaultRegion = "EG",
}: UsePhoneInputOptions): UsePhoneInputResult {
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

  const country = useMemo(() => (prefixDigits ? resolveCountry(region) : undefined), [prefixDigits, region]);
  const nationalDisplay = useMemo(
    () => formatNationalDigits(nationalDigits, region ?? defaultRegion),
    [nationalDigits, region, defaultRegion]
  );
  const prefixInvalid = prefixDigits.length > 0 && !isCallingCodePrefixValid(prefixDigits);
  const hasInput = prefixDigits.length > 0 || nationalDigits.length > 0;
  const isValid = isCompletePhoneValid(prefixDigits, nationalDigits, region, defaultRegion);
  const phoneInvalid = hasInput && !prefixInvalid && !isValid;

  const emitChange = useCallback(
    (nextPrefixDigits: string, nextNationalDigits: string) => {
      const emitted = buildEmittedValue(nextPrefixDigits, nextNationalDigits);
      lastEmittedRef.current = emitted;
      onChangeAction(emitted);
    },
    [onChangeAction]
  );

  useEffect(() => {
    if (lastEmittedRef.current !== undefined && value === lastEmittedRef.current) {
      return;
    }
    lastEmittedRef.current = value;
    const parts = splitPhoneValueToParts(value, defaultRegion);
    setRegion(parts.prefixDigits ? (parts.region ?? defaultRegion) : null);
    setPrefixDigits(parts.prefixDigits);
    setNationalDigits(parts.nationalDigits);
  }, [value, defaultRegion]);

  const focusPrefix = useCallback(() => {
    setActiveSlot("prefix");
    prefixInputRef.current?.focus();
  }, []);

  const focusNational = useCallback(() => {
    setActiveSlot("national");
    nationalInputRef.current?.focus();
  }, []);

  const updateFromPrefix = useCallback(
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
    [defaultRegion, emitChange, nationalDigits, region]
  );

  const selectCountry = useCallback(
    (nextCountry: CountryType) => {
      const nextPrefix = nextCountry.phone;
      setRegion(nextCountry.code);
      setPrefixDigits(nextPrefix);
      emitChange(nextPrefix, nationalDigits);
      focusPrefix();
    },
    [emitChange, focusPrefix, nationalDigits]
  );

  const handlePrefixKeyDown = useCallback(
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

  const handleNationalKeyDown = useCallback(
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
    [defaultRegion, emitChange, focusPrefix, nationalDigits, nationalDisplay, prefixDigits, region]
  );

  const handleNationalSelect = useCallback(
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

  const resetPrefixDisplay = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      event.currentTarget.value = `+${prefixDigits}`;
    },
    [prefixDigits]
  );

  const resetNationalDisplay = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      event.currentTarget.value = nationalDisplay;
    },
    [nationalDisplay]
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
    setActiveSlot,
    selectCountry,
    handlePrefixKeyDown,
    handleNationalKeyDown,
    handleNationalSelect,
    resetPrefixDisplay,
    resetNationalDisplay,
    prefixInputRef,
    nationalInputRef,
    maxPrefixDisplayLength: getMaxCallingCodeLength() + 1,
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
