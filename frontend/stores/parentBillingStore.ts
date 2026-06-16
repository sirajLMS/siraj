// cspell:disable
import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";

export type ParentInvoiceStatus = "paid" | "unpaid";

export interface ParentBillingSummary {
  readonly outstandingBalance: string;
  readonly paidThisTerm: string;
  readonly nextDueDate: string;
  readonly activeStudents: string;
}

export interface ParentInvoiceRow {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly month: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly paidDate: string;
  readonly fee: string;
  readonly status: ParentInvoiceStatus;
}

interface ParentBillingState {
  readonly searchQuery: string;
  readonly summary: ParentBillingSummary;
  readonly invoices: readonly ParentInvoiceRow[];
  setSearchQuery: (query: string) => void;
  payNow: (id: string) => void;
  downloadPdf: (id: string) => void;
}

const MOCK_SUMMARY: ParentBillingSummary = {
  outstandingBalance: "$450.00",
  paidThisTerm: "$2,200.00",
  nextDueDate: "Nov 15, 2023",
  activeStudents: "02",
};

const MOCK_INVOICES: ParentInvoiceRow[] = [
  {
    id: "pinv-1002",
    invoiceNumber: "INV-2023-1002",
    month: "October",
    issueDate: "Oct 01, 2023",
    dueDate: "Oct 15, 2023",
    paidDate: "Oct 12, 2023",
    fee: "$550.00",
    status: "paid",
  },
  {
    id: "pinv-0901",
    invoiceNumber: "INV-2023-0901",
    month: "September",
    issueDate: "Sep 01, 2023",
    dueDate: "Sep 15, 2023",
    paidDate: "Sep 10, 2023",
    fee: "$550.00",
    status: "paid",
  },
  {
    id: "pinv-1103",
    invoiceNumber: "INV-2023-1103",
    month: "November",
    issueDate: "Nov 01, 2023",
    dueDate: "Nov 15, 2023",
    paidDate: "—",
    fee: "$450.00",
    status: "unpaid",
  },
];

export const useParentBillingStore = create<ParentBillingState>(set => ({
  searchQuery: "",
  summary: MOCK_SUMMARY,
  invoices: MOCK_INVOICES,
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
  payNow: (id: string) => {
    logger.info("Pay invoice now", { id });
  },
  downloadPdf: (id: string) => {
    logger.info("Download invoice PDF", { id });
  },
}));
