import type { CountryType } from "@/frontend/common/lib/locale";

export type CountryOptionRowProps = {
  readonly country: CountryType;
  readonly locale: string;
  readonly showPhonePrefix?: boolean;
};
