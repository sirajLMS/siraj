import { CountryCode, type CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { type CountryType, countries } from "@/frontend/common/lib/locale";

const VALID_COUNTRY_CODES = new Set(Object.values(CountryCode) as readonly string[]);

function isCountryCode(value: string): value is CountryCode {
  return VALID_COUNTRY_CODES.has(value);
}

export function toCountryCodeOrEmpty(value: string | null | undefined): CountryCode | "" {
  if (value && isCountryCode(value)) return value;
  return "";
}

export type ActivateFormValues = {
  code: CurrencyCode | "";
  symbol: string;
  countryCode: CountryCode | "";
  decimals: string;
  sortOrder: string;
};

export function defaultValues(): ActivateFormValues {
  return {
    code: "",
    symbol: "",
    countryCode: "",
    decimals: "",
    sortOrder: "",
  };
}

export function resolveCountry(code: string | null | undefined): CountryType | undefined {
  if (!code) return undefined;
  return countries.find(country => country.code.toString() === code);
}
