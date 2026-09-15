import type { classCategories } from "@/backend/db/schema";

export type ClassCategorySelectType = typeof classCategories.$inferSelect;

export type ClassCategoryReturnType = Omit<ClassCategorySelectType, "createdAt" | "updatedAt" | "deletedAt">;

export type ClassCategorySubmitInput = {
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type ClassCategoryUpdateInput = {
  name?: string;
  slug?: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};
