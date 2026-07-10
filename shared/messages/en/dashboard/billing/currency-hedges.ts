import type { CurrencyHedgesLabels } from "@/shared/messages/types/dashboard/billing/currency-hedges";

export const currencyHedges: CurrencyHedgesLabels = {
  pageTitle: "Currency Hedges",
  pageSubtitle: "Manage currency hedges for financial planning",
  addHedge: "Add Hedge",
  editHedge: "Edit Hedge",
  deleteHedge: "Delete Hedge",
  deleteConfirm: "Are you sure you want to delete this hedge?",
  cancel: "Cancel",
  save: "Save",
  createSuccess: "Currency hedge created successfully",
  updateSuccess: "Currency hedge updated successfully",
  deleteSuccess: "Currency hedge deleted successfully",
  saveFailed: "Failed to save hedge",
  empty: "No currency hedges defined",
  columns: {
    currency: "Currency",
    amount: "Amount",
    hedgeType: "Type",
    notes: "Notes",
    updatedAt: "Last Updated",
    actions: "Actions",
  },
  fields: {
    currency: "Currency",
    amount: "Amount",
    hedgeType: "Hedge Type",
    notes: "Notes",
  },
  hedgeTypes: {
    long: "Long",
    short: "Short",
  },
};
