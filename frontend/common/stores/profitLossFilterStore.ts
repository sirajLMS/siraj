"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";

/** localStorage key the persisted filter state is written under. */
const STORAGE_KEY = "profit-loss-filter";

/** Rows per server page on first load. */
const DEFAULT_PAGE_SIZE = 25;

/** Dashboard tabs, in sidebar order. */
export const PROFIT_LOSS_TABS = ["payments", "expenses", "income", "profits"] as const;

export type ProfitLossTab = (typeof PROFIT_LOSS_TABS)[number];

/**
 * Filter, tab, and pagination state for the profit & loss dashboard.
 *
 * Month, currency, and the active tab survive reloads via the persist
 * middleware (localStorage, key `profit-loss-filter`), so a returning
 * reviewer lands on the report they left. Each tab keeps its own page
 * index so switching tabs never loses the reader's place; page setters
 * clamp to a non-negative integer so a stale persisted value or a
 * negative input can never reach the GraphQL offset.
 */
export interface ProfitLossFilterState {
  /** Accounting month filter (YYYY-MM). */
  month: string;
  /** Currency all monetary values are converted into for display. */
  currency: CurrencyCode;
  /** Currently selected dashboard tab. */
  activeTab: ProfitLossTab;
  /** Server page index (0-based) of the Payments tab. */
  paymentsPage: number;
  /** Server page index (0-based) of the Expenses tab. */
  expensesPage: number;
  /** Server page index (0-based) of the Income Payments tab. */
  incomePage: number;
  /** Rows per server page, shared by every tab. */
  pageSize: number;
}

interface ProfitLossFilterStore extends ProfitLossFilterState {
  setMonth: (month: string) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setActiveTab: (activeTab: ProfitLossTab) => void;
  setPaymentsPage: (page: number) => void;
  setExpensesPage: (page: number) => void;
  setIncomePage: (page: number) => void;
  /** Restores the pristine store, including the current month default. */
  reset: () => void;
}

/** Current UTC accounting month as YYYY-MM. */
function currentUtcMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function defaultState(): ProfitLossFilterState {
  return {
    month: currentUtcMonth(),
    currency: CurrencyCode.Sar,
    activeTab: "payments",
    paymentsPage: 0,
    expensesPage: 0,
    incomePage: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

function toNonNegativePage(page: number): number {
  if (!Number.isFinite(page)) return 0;
  return Math.max(0, Math.trunc(page));
}

/** Switching month can change every tab's result set, so all pages restart. */
function toMonthChangeState(month: string): Partial<ProfitLossFilterState> {
  return { month, paymentsPage: 0, expensesPage: 0, incomePage: 0 };
}

const VALID_CURRENCIES = new Set<string>(Object.values(CurrencyCode));

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && VALID_CURRENCIES.has(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProfitLossTab(value: unknown): value is ProfitLossTab {
  return typeof value === "string" && (PROFIT_LOSS_TABS as readonly string[]).includes(value);
}

function isNonNegativePage(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * Rehydration guard: every persisted field must still be schema-valid before
 * it is trusted. Anything missing or drifted (e.g. a currency removed from the
 * enum) falls back to the pristine default for that field.
 */
function mergePersistedState(persistedState: unknown, currentState: ProfitLossFilterStore): ProfitLossFilterStore {
  const persisted = isRecord(persistedState) ? persistedState : {};
  const defaults = defaultState();

  const month =
    typeof persisted.month === "string" && /^\d{4}-\d{2}$/.test(persisted.month) ? persisted.month : defaults.month;

  const currency = isCurrencyCode(persisted.currency) ? persisted.currency : defaults.currency;

  const activeTab = isProfitLossTab(persisted.activeTab) ? persisted.activeTab : defaults.activeTab;

  const paymentsPage = isNonNegativePage(persisted.paymentsPage) ? Math.trunc(persisted.paymentsPage) : 0;
  const expensesPage = isNonNegativePage(persisted.expensesPage) ? Math.trunc(persisted.expensesPage) : 0;
  const incomePage = isNonNegativePage(persisted.incomePage) ? Math.trunc(persisted.incomePage) : 0;
  const pageSize =
    isNonNegativePage(persisted.pageSize) && persisted.pageSize >= 1
      ? Math.trunc(persisted.pageSize)
      : defaults.pageSize;

  return {
    ...currentState,
    month,
    currency,
    activeTab,
    paymentsPage,
    expensesPage,
    incomePage,
    pageSize,
  };
}

export const useProfitLossFilterStore = create<ProfitLossFilterStore>()(
  persist(
    set => ({
      ...defaultState(),
      setMonth: month => set(toMonthChangeState(month)),
      setCurrency: currency => set({ currency }),
      setActiveTab: activeTab => set({ activeTab }),
      setPaymentsPage: page => set({ paymentsPage: toNonNegativePage(page) }),
      setExpensesPage: page => set({ expensesPage: toNonNegativePage(page) }),
      setIncomePage: page => set({ incomePage: toNonNegativePage(page) }),
      reset: () => set(defaultState()),
    }),
    {
      name: STORAGE_KEY,
      merge: (persistedState, currentState) => mergePersistedState(persistedState, currentState),
    }
  )
);
