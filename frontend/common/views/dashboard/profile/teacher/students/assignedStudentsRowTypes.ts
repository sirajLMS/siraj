/**
 * Shared row type for assigned-students tier variants.
 *
 * Both the mobile card-list variant (`assignedStudentsCardList.mobile.tsx`)
 * and the desktop AppDataGrid variant (`assignedStudentsDataGrid.desktop.tsx`)
 * import this type — mobile and desktop variants must not import from each
 * other, so the row contract lives in the shared teacher domain layer.
 */
export type AssignedStudentsRow = {
  readonly id: string;
  readonly studentName: string;
  readonly studentAvatarUrl: string | null;
  readonly parentName: string;
  readonly parentAvatarUrl: string | null;
  readonly parentId: string | null;
  readonly parentUserId: string | null;
  readonly className: string;
  readonly status: string;
  readonly hoursPerWeek: number;
  readonly classesRemaining: number;
  readonly classesTotal: number;
};
