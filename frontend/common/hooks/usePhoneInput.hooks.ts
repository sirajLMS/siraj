"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildEmittedValue, resolveCountry } from "@/frontend/common/hooks/usePhoneInput.helpers";
import type { PhoneInputSlot, PhoneInputState } from "@/frontend/common/hooks/usePhoneInput.types";
import type { CountryType } from "@/frontend/common/lib/locale";
import {
  formatNationalDigits,
  isCallingCodePrefixValid,
  isCompletePhoneValid,
  splitPhoneValueToParts,
} from "@/shared/lib/phone";

export function usePhoneStateSync(
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

export function useFocusSlot(
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

export function useDerivedPhoneState(
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

export function usePhoneInputState(value: string | null, defaultRegion: string): PhoneInputState {
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

export function useEmitChange(
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
