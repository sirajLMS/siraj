"use client";

import { useEffect, useState } from "react";
import type { CountryDetectionResult } from "./types";

const MAX_REQUESTS_PER_DAY = 5;

const STORAGE_KEYS = {
  countryCode: "countryCode",
  fetchDate: "countryCodeFetchDate",
  requestCount: "countryCodeRequestCount",
} as const;

function hasClientWindow() {
  return globalThis.window !== undefined;
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
  defaultCountryCode: string
) => {
  try {
    const response = await fetch("https://ipapi.co/json/");
    if (response.status === 429) {
      setError("Request limit reached for today");
      setLoading(false);
      return;
    }
    const data: { country_code: string } = await response.json();
    setLocalStorageItem(STORAGE_KEYS.countryCode, data.country_code);
    setLocalStorageItem(STORAGE_KEYS.fetchDate, new Date().toISOString());
    setCountryCode(data.country_code);
  } catch {
    setError("Failed to detect country");
    setLocalStorageItem(STORAGE_KEYS.requestCount, MAX_REQUESTS_PER_DAY.toString());
    setLocalStorageItem(STORAGE_KEYS.countryCode, defaultCountryCode);
    setCountryCode(defaultCountryCode);
  } finally {
    const storedRequestCount = getLocalStorageItem(STORAGE_KEYS.requestCount);
    const requestCount = storedRequestCount ? parseInt(storedRequestCount, 10) : 0;
    setLocalStorageItem(STORAGE_KEYS.requestCount, (requestCount + 1).toString());
    setLoading(false);
  }
};

const fetchCountryCode = (
  setCountryCode: (code: string) => void,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void,
  defaultCountryCode: string
) => {
  if (!hasClientWindow()) {
    detectCountry(setCountryCode, setError, setLoading, defaultCountryCode);
    return;
  }

  const storedCountryCode = getLocalStorageItem(STORAGE_KEYS.countryCode);
  const storedFetchDate = getLocalStorageItem(STORAGE_KEYS.fetchDate);
  const storedRequestCount = getLocalStorageItem(STORAGE_KEYS.requestCount);
  const fetchDate = storedFetchDate ? new Date(storedFetchDate) : null;
  const now = new Date();
  const requestCount = storedRequestCount ? parseInt(storedRequestCount, 10) : 0;

  if (storedCountryCode && fetchDate && now.getDate() === fetchDate.getDate()) {
    if (requestCount < MAX_REQUESTS_PER_DAY) {
      setLocalStorageItem(STORAGE_KEYS.requestCount, (requestCount + 1).toString());
      setCountryCode(storedCountryCode);
      setLoading(false);
      return;
    }
    setError("Request limit reached for today");
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

  detectCountry(setCountryCode, setError, setLoading, defaultCountryCode);
};

export function useCountryDetection(timeout: number = 2000, defaultCountryCode: string = "SA"): CountryDetectionResult {
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        setCountryCode(defaultCountryCode);
        setLoading(false);
      }
    }, timeout);

    if (hasClientWindow()) {
      const storedCountryCode = getLocalStorageItem(STORAGE_KEYS.countryCode);
      const storedFetchDate = getLocalStorageItem(STORAGE_KEYS.fetchDate);
      const fetchDate = storedFetchDate ? new Date(storedFetchDate) : null;
      const now = new Date();

      if (storedCountryCode && fetchDate && now.getDate() === fetchDate.getDate()) {
        setCountryCode(storedCountryCode);
        setLoading(false);
      } else {
        fetchCountryCode(setCountryCode, setError, setLoading, defaultCountryCode);
      }
    } else {
      fetchCountryCode(setCountryCode, setError, setLoading, defaultCountryCode);
    }

    return () => clearTimeout(timeoutId);
  }, [loading, timeout, defaultCountryCode]);

  return {
    countryCode: countryCode ?? defaultCountryCode,
    countryCodeLoading: loading,
    countryCodeError: error,
  };
}
