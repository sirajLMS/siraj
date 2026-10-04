"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_PAGE_SIZE, STORAGE_KEY } from "@/frontend/common/stores/searchScheduleStore.constants";
import {
  createClearedSearchScheduleState,
  createDefaultDraftFilters,
  createMonthDrawerOpenedState,
  draftToActiveInput,
  extractPersistedDraftFilters,
  mergeDraftWithPersistedFilters,
  resolveEnsureDraftDates,
  resolveTeacherNameSearch,
} from "@/frontend/common/stores/searchScheduleStore.helpers";
import type {
  PersistedSearchScheduleState,
  SearchScheduleState,
} from "@/frontend/common/stores/searchScheduleStore.types";
import { isPersistedSearchScheduleState } from "@/frontend/common/stores/searchScheduleStore.validation";

export type {
  SearchScheduleDraftFilters,
  SearchScheduleGapItem,
  SearchScheduleMonthDrawerTeacher,
  SearchScheduleTeacherOption,
} from "@/frontend/common/stores/searchScheduleStore.types";

export const useSearchScheduleStore = create<SearchScheduleState>()(
  persist(
    (set, get) => ({
      draft: createDefaultDraftFilters(),
      activeInput: null,
      hasSearched: false,
      page: 0,
      pageSize: DEFAULT_PAGE_SIZE,
      selectedTeacher: null,
      hasHydrated: false,
      // Transient drawer/menu/month UI state — formFilterDrawerOpen stays false until the toolbar
      // opens it; sortMenuAnchorEl is a non-serializable DOM element excluded from persist.
      formFilterDrawerOpen: false,
      sortMenuAnchorEl: null,
      monthDrawerOpen: false,
      monthDrawerAnchorFromDate: "",
      monthDrawerCurrentMonth: "",
      monthDrawerTeacher: null,
      setDraft: draft =>
        set(state => ({
          draft: { ...state.draft, ...draft },
        })),
      setSelectedTeacher: selectedTeacher => set({ selectedTeacher }),
      setHasHydrated: hasHydrated => set({ hasHydrated }),
      setFormFilterDrawerOpen: formFilterDrawerOpen => set({ formFilterDrawerOpen }),
      setSortMenuAnchorEl: sortMenuAnchorEl => set({ sortMenuAnchorEl }),
      openMonthDrawer: (teacher, anchorFromDate) => set(createMonthDrawerOpenedState(teacher, anchorFromDate)),
      closeMonthDrawer: () => set({ monthDrawerOpen: false }),
      setMonthDrawerCurrentMonth: monthDrawerCurrentMonth => set({ monthDrawerCurrentMonth }),
      commitSearch: () => {
        const { draft, pageSize, selectedTeacher } = get();
        const teacherNameSearch = resolveTeacherNameSearch(selectedTeacher);
        set({
          activeInput: draftToActiveInput(draft, 0, pageSize, teacherNameSearch),
          hasSearched: true,
          page: 0,
        });
      },
      setPage: page => {
        const { draft, pageSize, selectedTeacher } = get();
        const teacherNameSearch = resolveTeacherNameSearch(selectedTeacher);
        set({
          page,
          activeInput: draftToActiveInput(draft, page, pageSize, teacherNameSearch),
        });
      },
      clearFilters: () => set(createClearedSearchScheduleState()),
      ensureDraftDates: () => {
        const nextDraft = resolveEnsureDraftDates(get().draft);
        if (nextDraft) {
          set({ draft: nextDraft });
        }
      },
      buildActiveInput: () => {
        const { draft, page, pageSize, activeInput, selectedTeacher } = get();
        if (!activeInput) {
          return null;
        }
        const teacherNameSearch = resolveTeacherNameSearch(selectedTeacher);
        return draftToActiveInput(draft, page, pageSize, teacherNameSearch);
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state): PersistedSearchScheduleState => ({
        draftFilters: extractPersistedDraftFilters(state.draft),
        selectedTeacher: state.selectedTeacher,
        pageSize: state.pageSize,
        // Transient UI state (formFilterDrawerOpen, monthDrawerOpen) and the non-serializable
        // sortMenuAnchorEl are excluded from persistence.
        monthDrawerAnchorFromDate: state.monthDrawerAnchorFromDate,
        monthDrawerCurrentMonth: state.monthDrawerCurrentMonth,
        monthDrawerTeacher: state.monthDrawerTeacher,
      }),
      merge: (persistedState, currentState) => {
        const persisted = isPersistedSearchScheduleState(persistedState) ? persistedState : undefined;

        return {
          ...currentState,
          draft: mergeDraftWithPersistedFilters(persisted?.draftFilters),
          selectedTeacher: persisted?.selectedTeacher ?? null,
          pageSize: persisted?.pageSize ?? currentState.pageSize,
          formFilterDrawerOpen: false,
          sortMenuAnchorEl: null,
          monthDrawerOpen: false,
          monthDrawerAnchorFromDate: persisted?.monthDrawerAnchorFromDate ?? "",
          monthDrawerCurrentMonth: persisted?.monthDrawerCurrentMonth ?? "",
          monthDrawerTeacher: persisted?.monthDrawerTeacher ?? null,
        };
      },
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    }
  )
);
