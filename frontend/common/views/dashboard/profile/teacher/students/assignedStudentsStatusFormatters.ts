// NEW FOR PLAN v5: pure-data formatter previously leaked as a lowercase helper in
// both assignedStudentsCardList.mobile.tsx and assignedStudentsDataGrid.desktop.tsx
// (specs.md §3 N9). Lifted here so both tiers import the same helper.
export function formatStatusLabel(status: string): string {
  const normalized = status.replaceAll("_", " ").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
