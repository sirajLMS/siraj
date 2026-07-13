import { create } from "zustand";

interface SupervisorDashboardState {
  readonly hasVisitedReviews: boolean;
  readonly hasVisitedDues: boolean;
  readonly markReviewsVisited: () => void;
  readonly markDuesVisited: () => void;
}

export const useSupervisorDashboardStore = create<SupervisorDashboardState>(set => ({
  hasVisitedReviews: false,
  hasVisitedDues: false,
  markReviewsVisited: () => set({ hasVisitedReviews: true }),
  markDuesVisited: () => set({ hasVisitedDues: true }),
}));
