export const CREDIT_HOURS_CONFIG = {
  name: "creditHours" as const,
  labelKey: "creditHours" as const,
  step: 0.5,
  min: 0.5,
  inputMode: "decimal" as const,
};

export const PRICE_AMOUNT_CONFIG = {
  name: "priceAmount" as const,
  labelKey: "priceAmount" as const,
  step: 0.01,
  min: 0,
  inputMode: "decimal" as const,
};

export const SORT_ORDER_CONFIG = {
  name: "sortOrder" as const,
  labelKey: "sortOrder" as const,
  step: 1,
  min: 0,
};
