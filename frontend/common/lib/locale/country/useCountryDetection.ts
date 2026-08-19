"use client";

import { useEffect, useMemo, useState } from "react";
import type { CountryDetectionResult } from "@/frontend/common/lib/locale/country/types";
import { Translation, useAppTranslation } from "@/shared/locale";

const MAX_REQUESTS_PER_DAY = 5;

const STORAGE_KEYS = {
  countryCode: "countryCode",
  fetchDate: "countryCodeFetchDate",
  requestCount: "countryCodeRequestCount",
} as const;

function hasClientWindow() {
  return typeof globalThis.window !== "undefined";
}

function getLocalStorageItem(key: string): string | null {
  if (!hasClientWindow()) {
    return null;
  }
  return globalThis.localStorage.getItem(key);
}

function setLocalStorageItem(key: string, value: string): void {
  if (!hasClientWindow()) {
    return;
  }
  globalThis.localStorage.setItem(key, value);
}

const detectCountry = async (
  setCountryCode: (code: string) => void,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void,
  defaultCountryCode: string,
  errorMessages: { requestLimitReached: string; detectionFailed: string }
) => {
  try {
    const response = await fetch("https://ipapi.co/json/");
    if (response.status === 429) {
      setError(errorMessages.requestLimitReached);
      setLoading(false);
      return;
    }
    const data: { country_code: string } = await response.json();
    setLocalStorageItem(STORAGE_KEYS.countryCode, data.country_code);
    setLocalStorageItem(STORAGE_KEYS.fetchDate, new Date().toISOString());
    setCountryCode(data.country_code);
  } catch {
    setError(errorMessages.detectionFailed);
    setLocalStorageItem(STORAGE_KEYS.requestCount, MAX_REQUESTS_PER_DAY.toString());
    setLocalStorageItem(STORAGE_KEYS.countryCode, defaultCountryCode);
    setCountryCode(defaultCountryCode);
  } finally {
    const storedRequestCount = getLocalStorageItem(STORAGE_KEYS.requestCount);
    const requestCount = storedRequestCount ? Number.parseInt(storedRequestCount, 10) : 0;
    setLocalStorageItem(STORAGE_KEYS.requestCount, (requestCount + 1).toString());
    setLoading(false);
  }
};

const fetchCountryCode = (
  setCountryCode: (code: string) => void,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void,
  defaultCountryCode: string,
  errorMessages: { requestLimitReached: string; detectionFailed: string }
) => {
  if (!hasClientWindow()) {
    void detectCountry(setCountryCode, setError, setLoading, defaultCountryCode, errorMessages);
    return;
  }

  const storedCountryCode = getLocalStorageItem(STORAGE_KEYS.countryCode);
  const storedFetchDate = getLocalStorageItem(STORAGE_KEYS.fetchDate);
  const storedRequestCount = getLocalStorageItem(STORAGE_KEYS.requestCount);
  const fetchDate = storedFetchDate ? new Date(storedFetchDate) : null;
  const now = new Date();
  const requestCount = storedRequestCount ? Number.parseInt(storedRequestCount, 10) : 0;

  if (storedCountryCode && now.getDate() === fetchDate?.getDate()) {
    if (requestCount < MAX_REQUESTS_PER_DAY) {
      setLocalStorageItem(STORAGE_KEYS.requestCount, (requestCount + 1).toString());
      setCountryCode(storedCountryCode);
      setLoading(false);
      return;
    }
    setError(errorMessages.requestLimitReached);
    setLocalStorageItem(STORAGE_KEYS.requestCount, MAX_REQUESTS_PER_DAY.toString());
    setLoading(false);
    return;
  }

  if (storedCountryCode && (!fetchDate || !storedRequestCount)) {
    setLocalStorageItem(STORAGE_KEYS.fetchDate, new Date().toISOString());
    setLocalStorageItem(STORAGE_KEYS.requestCount, "1");
    setCountryCode(storedCountryCode);
    setLoading(false);
    return;
  }

  void detectCountry(setCountryCode, setError, setLoading, defaultCountryCode, errorMessages);
};

function getCachedCountryCode(): string | null {
  if (!hasClientWindow()) {
    return null;
  }
  const storedCountryCode = getLocalStorageItem(STORAGE_KEYS.countryCode);
  const storedFetchDate = getLocalStorageItem(STORAGE_KEYS.fetchDate);
  const fetchDate = storedFetchDate ? new Date(storedFetchDate) : null;
  const now = new Date();
  if (storedCountryCode && now.getDate() === fetchDate?.getDate()) {
    return storedCountryCode;
  }
  return null;
}

export function useCountryDetection(timeout: number = 2000, defaultCountryCode: string = "SA"): CountryDetectionResult {
  const t = useAppTranslation(Translation.Ui.CountrySelect);
  const [countryCode, setCountryCode] = useState<string | null>(getCachedCountryCode);
  const [loading, setLoading] = useState<boolean>(() => getCachedCountryCode() === null);
  const [error, setError] = useState<string | null>(null);

  const errorMessages = useMemo(
    () => ({ requestLimitReached: t.requestLimitReached, detectionFailed: t.detectionFailed }),
    [t.requestLimitReached, t.detectionFailed]
  );

  useEffect(() => {
    if (countryCode !== null) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setCountryCode(defaultCountryCode);
      setLoading(false);
    }, timeout);

    fetchCountryCode(setCountryCode, setError, setLoading, defaultCountryCode, errorMessages);

    return () => clearTimeout(timeoutId);
  }, [countryCode, timeout, defaultCountryCode, errorMessages]);

  return {
    countryCode: countryCode ?? defaultCountryCode,
    countryCodeLoading: loading,
    countryCodeError: error,
  };
}
