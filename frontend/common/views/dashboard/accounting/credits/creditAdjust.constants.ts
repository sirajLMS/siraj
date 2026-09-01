/**
 * Client mirror of the server rule: a carryover payment date may be at most
 * this many days in the future. Shared by the form's submit validation and
 * the carryover banner's date-picker fence so both enforce the same bound.
 */
export const PAYMENT_DATE_MAX_FUTURE_DAYS = 1;
