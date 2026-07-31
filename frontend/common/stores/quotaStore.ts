import { create } from "zustand";
import {
  QuotaKind,
  type QuotaPeriodType,
  type QuotaStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface QuotaFormState {
  studentId: string;
  kind: QuotaKind;
  name: string;
  totalClasses: number;
  validFrom: string | null;
  validUntil: string | null;
  periodType: QuotaPeriodType | null;
  periodDays: number | null;
  priority: number;
}

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
  selectedQuotaId: string | null;
  filterStatus: QuotaStatus | null;
  filterKind: QuotaKind | null;
  searchQuery: string;
  setFormData: (data: Partial<QuotaFormState>) => void;
  resetFormData: () => void;
  setSelectedQuotaId: (id: string | null) => void;
  setFilterStatus: (status: QuotaStatus | null) => void;
  setFilterKind: (kind: QuotaKind | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useQuotaStore = create<QuotaStore>(set => ({
  formData: initialFormState,
  selectedQuotaId: null,
  filterStatus: null,
  filterKind: null,
  searchQuery: "",
  setFormData: data =>
    set(state => ({
      formData: { ...state.formData, ...data },
    })),
  resetFormData: () => set({ formData: initialFormState }),
  setSelectedQuotaId: id => set({ selectedQuotaId: id }),
  setFilterStatus: status => set({ filterStatus: status }),
  setFilterKind: kind => set({ filterKind: kind }),
  setSearchQuery: query => set({ searchQuery: query }),
}));
