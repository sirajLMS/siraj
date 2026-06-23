### Task N — Translations: i18n Dictionary Setup

**Objective:** Add all new localization keys required for the resource deletion UI and the new reporting UI to the English translations dictionary.

**Dependencies:** None specifically, but matches the UI strings used in Task K and Task L.

**Layer-Specific Rules (Frontend i18n):**
- Translations MUST reside in `shared/messages/en.ts` (and `ar/` equivalents if generated).
- Keep keys grouped by their specific domain/view (e.g., `Dashboard.Resources` and `Dashboard.Reports`).

**Target Files:**
- `shared/messages/en.ts`

**Detailed Implementation Steps:**

*Step 1: Update `en.ts`*

Open `shared/messages/en.ts`. Add the following keys to the dictionary.

```typescript
// shared/messages/en.ts
export const en = {
  // ... existing translations ...
  Dashboard: {
    // ...
    Resources: {
      // ... existing keys ...
      delete: "Delete Resource",
      deleteDialogTitle: "Delete Learning Resource",
      deleteConfirmationMessage: "Are you sure you want to permanently delete this resource? This action cannot be undone and the file will be removed from the server.",
      cancel: "Cancel",
      confirmDelete: "Delete",
      deleting: "Deleting..."
    },
    Reports: {
      title: "Academy Reports",
      fromDate: "From Date",
      toDate: "To Date",
      groupBy: "Group By",
      groupByDate: "Date",
      groupByTeacher: "Teacher",
      generateReport: "Generate Report",
      generating: "Generating...",
      errorGenerating: "Failed to generate report. Please try again.",
      group: "Group",
      taken: "Taken",
      absent: "Absent",
      leave: "Leave",
      totalHours: "Total Hours",
      paidEGP: "Paid (EGP)",
      paidUSD: "Paid (USD)"
    }
  }
};
```

**Test Execution Requirements:**
- Run typescript compilation to verify the dictionary structure is valid.
  ```bash
  bun tsgo
  ```

**Success Criteria / Check Progress Points:**
- [ ] All new UI strings from Task K and Task L have corresponding keys in `en.ts`.
- [ ] TypeScript compilation passes cleanly.

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
