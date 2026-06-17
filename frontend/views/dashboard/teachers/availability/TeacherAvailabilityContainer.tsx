// cspell:disable
"use client";

import { useTeacherAvailabilityStore } from "@/frontend/stores/mockTeacherAvailabilityStore";
import { TeacherAvailabilityView } from "./TeacherAvailabilityView";

export function TeacherAvailabilityContainer() {
  const { weeklyAvailability, insights, searchFilters } = useTeacherAvailabilityStore();

  // Convert string times from store to Date objects for the form
  const defaultFilters = {
    fromTime: null, // In a real app, parse searchFilters.from
    toTime: null, // In a real app, parse searchFilters.to
    gender: searchFilters.gender.toLowerCase() as "any" | "male" | "female",
  };

  return (
    <TeacherAvailabilityView availability={weeklyAvailability} insights={insights} defaultFilters={defaultFilters} />
  );
}
