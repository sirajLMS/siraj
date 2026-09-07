import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

export const dashboardAccountingExpensesEn: ExpensesLabels = {
  title: "Expense Ledger",
  empty: "No expenses match the current filters.",
  loadError: "Failed to load expenses. Please try again.",
  exportFailed: "CSV export failed. Please try again.",
  exportTruncated: "Export truncated to 10 000 rows.",
  selectedCount: count => (count === 1 ? "1 selected" : `${count} selected`),
  deletedBadge: "Deleted",

  column: {
    title: "Title",
    type: "Type",
    teacher: "Teacher",
    value: "Value",
    paymentDate: "Payment date",
    expenseDate: "Expense month",
    source: "Source",
    note: "Note",
    createdAt: "Created at",
    actions: "Actions",
    rowActions: title => `Actions for "${title}"`,
  },

  type: {
    Salaries: "Salaries",
    Marketing: "Marketing",
    Logistics: "Logistics",
    Technology: "Technology",
  },

  source: {
    Manual: "Manual",
    FromCarryover: "From Carryover",
  },

  action: {
    addNew: "Add New",
    edit: "Edit",
    delete: "Delete",
    bulkDelete: "Bulk Delete",
    viewSource: "View source",
    exportCsv: "Export CSV",
  },

  filters: {
    title: "Title",
    searchPlaceholder: "Search titles",
    type: "Type",
    expenseDate: "Expense month",
    paymentDateFrom: "Payment date from",
    paymentDateTo: "Payment date to",
    paymentDateRange: "Payment date range",
    includeDeleted: "Include deleted",
    clear: "Clear",
  },

  modal: {
    form: {
      titleAdd: "Add Expense",
      titleEdit: "Edit Expense",
      title: "Title",
      type: "Type",
      teacher: "Teacher (optional)",
      value: "Value",
      currency: "Currency",
      paymentDate: "Payment date",
      expenseDate: "Expense month",
      note: "Note",
      salariesHint: "Salary expenses are created automatically through the carryover settlement flow.",
      sourceBanner: source => `This expense will be recorded with source: ${source}.`,
      submit: "Save",
      cancel: "Cancel",
    },
    delete: {
      title: "Delete this expense?",
      summary: (title, value, currency) => `Delete "${title}" (${value} ${currency})?`,
      reason: "Reason (optional)",
      reasonPlaceholder: "Explain why this expense is being deleted (max 500 characters)",
      confirm: "Delete",
      cancel: "Cancel",
    },
    bulkDelete: {
      title: count => {
        if (count === 1) return "Delete 1 expense?";
        return `Delete ${count} expenses?`;
      },
      confirm: "Delete",
      cancel: "Cancel",
    },
  },

  validation: {
    titleRequired: "Title is required.",
    titleTooLong: "Title must be 200 characters or fewer.",
    typeRequired: "Type is required.",
    valueRequired: "Value is required.",
    currencyRequired: "Currency is required.",
    valueNegative: "Value cannot be negative.",
    valueInvalid: "Enter a valid amount with up to 12 digits and 2 decimal places.",
    expenseDateInvalid: "Expense month must be in YYYY-MM format.",
    paymentDateInvalid: "Payment date must be a valid date.",
    noteTooLong: "Note must be 2,000 characters or fewer.",
  },

  error: {
    notFound: "Expense not found.",
    alreadyDeleted: "Expense is already deleted.",
    deleteViaUnpay: "This salary expense must be removed via the Carryover Unpay flow.",
    typeImmutableForSalaries: "Type is read-only for Salaries expenses.",
    valueImmutableForSalaries: "Value is read-only for Salaries expenses.",
  },

  success: {
    created: "Expense created.",
    updated: "Expense updated.",
    deleted: "Expense deleted.",
    bulkDeleted: count => {
      if (count === 0) return "No expenses deleted.";
      if (count === 1) return "1 expense deleted.";
      return `${count} expenses deleted.`;
    },
  },

  drawer: {
    title: title => `Expense — ${title}`,
    createdBy: "Created by",
    updatedAt: "Last updated",
    deletedBanner: "This expense has been deleted.",
    deletedAt: "Deleted at",
    deletionReason: "Deletion reason",
  },

  aggregate: {
    totalValue: "Total value",
    rowCount: "Rows",
  },
};
