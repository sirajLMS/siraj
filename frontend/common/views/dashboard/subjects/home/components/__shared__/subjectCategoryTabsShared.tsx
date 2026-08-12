"use client";

import { Box, Tab, Tabs } from "@mui/material";
import type { CategoryItem } from "@/frontend/common/views/dashboard/subjects/home/types";

export interface SubjectCategoryTabsProps {
  readonly labels: {
    readonly allCategories: string;
  };
  readonly categories: readonly CategoryItem[];
  readonly activeCategoryId: string | null;
  readonly onCategoryChange: (categoryId: string | null) => void;
}

/**
 * Shared category Tab bar used in both desktop and mobile `SubjectsView`.
 *
 * Only the surrounding page container differs between tiers; the Tabs markup
 * is identical.
 */
export function SubjectCategoryTabsShared({
  labels,
  categories,
  activeCategoryId,
  onCategoryChange,
}: Readonly<SubjectCategoryTabsProps>) {
  return (
    <Box sx={{ borderBottom: 1, borderColor: theme => theme.palette.outlineVariant }}>
      <Tabs
        value={activeCategoryId ?? false}
        onChange={(_e, val: string | false) => onCategoryChange(val === false ? null : val)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label={labels.allCategories} value={false} />
        {categories.map(cat => (
          <Tab key={cat.id} label={cat.name ?? ""} value={cat.id ?? ""} />
        ))}
      </Tabs>
    </Box>
  );
}
