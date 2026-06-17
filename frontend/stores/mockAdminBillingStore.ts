// cspell:disable
import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";

export type AdminInvoiceStatus = "overdue" | "pending" | "paid";

export type StudentCreditStatus = "negative_balance" | "active_credit";

export interface AdminBillingSummary {
  readonly totalOutstanding: string;
  readonly pendingInvoices: number;
  readonly negativeBalanceCount: string;
  readonly mtdRevenue: string;
}

export interface AdminInvoiceRow {
  readonly id: string;
  readonly studentName: string;
  readonly studentInitials: string;
  readonly dateIssued: string;
  readonly amount: string;
  readonly status: AdminInvoiceStatus;
}

export interface StudentCreditRow {
  readonly id: string;
  readonly studentName: string;
  readonly parentEmail: string;
  readonly planType: string;
  readonly classesLeft: number;
  readonly classesTotal: number;
  readonly status: StudentCreditStatus;
}

interface AdminBillingState {
  readonly searchQuery: string;
  readonly summary: AdminBillingSummary;
  readonly invoices: readonly AdminInvoiceRow[];
  readonly creditRows: readonly StudentCreditRow[];
  setSearchQuery: (query: string) => void;
  markAsPaid: (id: string) => void;
  sendReminder: (id: string) => void;
}

const MOCK_SUMMARY: AdminBillingSummary = {
  totalOutstanding: "$42,850.00",
  pendingInvoices: 124,
  negativeBalanceCount: "18 Students",
  mtdRevenue: "$15,420.50",
};

const MOCK_INVOICES: AdminInvoiceRow[] = [
  {
    id: "inv-8821",
    studentName: "Amina Mansour",
    studentInitials: "AM",
    dateIssued: "Oct 24, 2023",
    amount: "$450.00",
    status: "overdue",
  },
  {
    id: "inv-8820",
    studentName: "John Hasan",
    studentInitials: "JH",
    dateIssued: "Oct 23, 2023",
    amount: "$320.00",
    status: "pending",
  },
  {
    id: "inv-8819",
    studentName: "Leila Fadel",
    studentInitials: "LF",
    dateIssued: "Oct 22, 2023",
    amount: "$1,200.00",
    status: "paid",
  },
  {
    id: "inv-8818",
    studentName: "Rami Kassab",
    studentInitials: "RK",
    dateIssued: "Oct 21, 2023",
    amount: "$550.00",
    status: "overdue",
  },
];

const MOCK_CREDIT_ROWS: StudentCreditRow[] = [
  {
    id: "credit-001",
    studentName: "Yusef Al-Amin",
    parentEmail: "yusef.p@email.com",
    planType: "Premium Weekly",
    classesLeft: -2,
    classesTotal: 12,
    status: "negative_balance",
  },
  {
    id: "credit-002",
    studentName: "Sami Al-Fayed",
    parentEmail: "sami.f@email.com",
    planType: "Basic Monthly",
    classesLeft: -5,
    classesTotal: 8,
    status: "negative_balance",
  },
  {
    id: "credit-003",
    studentName: "Fatima Omar",
    parentEmail: "fatima.z@email.com",
    planType: "Premium Weekly",
    classesLeft: 8,
    classesTotal: 12,
    status: "active_credit",
  },
];

export const useAdminBillingStore = create<AdminBillingState>(set => ({
  searchQuery: "",
  summary: MOCK_SUMMARY,
  invoices: MOCK_INVOICES,
  creditRows: MOCK_CREDIT_ROWS,
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
  markAsPaid: (id: string) => {
    logger.info("Mark invoice as paid", { id });
  },
  sendReminder: (id: string) => {
    logger.info("Send billing reminder", { id });
  },
}));
