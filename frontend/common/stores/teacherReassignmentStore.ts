"use client";

import { create } from "zustand";
import type { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";

interface TeacherReassignmentState {
  readonly selectedTeacherId: string;
  readonly selectedNewStatus: StudentStatus | "";
  readonly saved: boolean;
  readonly setSelectedTeacherId: (id: string) => void;
  readonly setSelectedNewStatus: (status: StudentStatus | "") => void;
  readonly setSaved: (saved: boolean) => void;
  readonly reset: () => void;
}

export const useTeacherReassignmentStore = create<TeacherReassignmentState>(set => ({
  selectedTeacherId: "",
  selectedNewStatus: "",
  saved: false,
  setSelectedTeacherId: id => {
    set({ selectedTeacherId: id });
  },
  setSelectedNewStatus: status => {
    set({ selectedNewStatus: status });
  },
  setSaved: saved => {
    set({ saved });
  },
  reset: () => {
    set({ selectedTeacherId: "", selectedNewStatus: "", saved: false });
  },
}));
