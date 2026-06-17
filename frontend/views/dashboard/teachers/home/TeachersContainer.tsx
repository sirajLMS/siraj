"use client";

import { useTeachersStore } from "@/frontend/stores/mockTeachersStore";
import { TeachersView } from "./TeachersView";

export function TeachersContainer() {
  const { metrics, rows, totalTeachers, searchQuery, setSearchQuery } = useTeachersStore();

  return (
    <TeachersView
      metrics={metrics}
      rows={rows}
      totalTeachers={totalTeachers}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    />
  );
}
