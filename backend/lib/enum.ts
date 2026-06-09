import { CountryCode, Gender } from "@/lib/enum";

export const parseCountryCode = (value: string | null | undefined): CountryCode | null => {
  if (!value) return null;

  const upperValue = value.toUpperCase();
  return Object.values(CountryCode).includes(upperValue as CountryCode) ? (upperValue as CountryCode) : null;
};

export const parseGender = (value: string | null | undefined): Gender | null => {
  if (!value) return null;

  const upperValue = value.toUpperCase();
  return Object.values(Gender).includes(upperValue as Gender) ? (upperValue as Gender) : null;
};
