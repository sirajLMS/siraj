"use client";

import { create } from "zustand";

interface TeacherDuesState {
  readonly selectedDueIds: string[];
  readonly setSelectedDueIds: (ids: string[]) => void;
  readonly toggleDueId: (id: string) => void;
  readonly clearSelection: () => void;
}

export const useTeacherDuesStore = create<TeacherDuesState>((set, get) => ({
  selectedDueIds: [],
  setSelectedDueIds: ids => set({ selectedDueIds: ids }),
  toggleDueId: id => {
    const current = get().selectedDueIds;
    if (current.includes(id)) {
      set({ selectedDueIds: current.filter(i => i !== id) });
    } else {
      set({ selectedDueIds: [...current, id] });
    }
  },
  clearSelection: () => set({ selectedDueIds: [] }),
}));
