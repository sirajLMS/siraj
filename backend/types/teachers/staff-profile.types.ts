// R1/R4 NOTE: ManagerProfileUpdateInput uses an `*IsSet` boolean pattern to
// distinguish "field not provided" from "field explicitly set to null". This is
// a DIFFERENT purpose from staff/staff-profile.types.ts UpdateManagerProfileInput
// (which uses standard optional fields). Both are intentionally kept; NOT a duplicate.
export interface ManagerProfileUpdateInput {
  readonly phone?: string | null;
  readonly phoneIsSet?: boolean;
  readonly status?: string | null;
  readonly statusIsSet?: boolean;
  readonly hourlyRate?: string | null;
  readonly hourlyRateIsSet?: boolean;
  readonly rateCurrency?: string | null;
  readonly rateCurrencyIsSet?: boolean;
}
