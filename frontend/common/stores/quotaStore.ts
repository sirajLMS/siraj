import { create } from "zustand";
import {
  QuotaKind,
  type QuotaStatus,
  type QuotaSubmitInput,
} from "@/frontend/common/graphql/generated/gql/graphql-types";

export type QuotaFormState = Pick<
  QuotaSubmitInput,
  "studentId" | "kind" | "name" | "totalClasses" | "validFrom" | "validUntil" | "periodType" | "periodDays" | "priority"
>;

const initialFormState: QuotaFormState = {
  studentId: "",
  kind: QuotaKind.Package,
  name: "",
  totalClasses: 10,
  validFrom: null,
  validUntil: null,
  periodType: null,
  periodDays: null,
  priority: 10,
};

interface QuotaStore {
  formData: QuotaFormState;
  filterStatus: QuotaStatus | null;
  filterKind: QuotaKind | null;
  searchQuery: string;
  setFormData: (data: Partial<QuotaFormState>) => void;
  resetFormData: () => void;
  setFilterStatus: (status: QuotaStatus | null) => void;
  setFilterKind: (kind: QuotaKind | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useQuotaStore = create<QuotaStore>(set => ({
  formData: initialFormState,
  filterStatus: null,
  filterKind: null,
  searchQuery: "",
  setFormData: data =>
    set(state => ({
      formData: { ...state.formData, ...data },
    })),
  resetFormData: () => set({ formData: initialFormState }),
  setFilterStatus: status => set({ filterStatus: status }),
  setFilterKind: kind => set({ filterKind: kind }),
  setSearchQuery: query => set({ searchQuery: query }),
}));
