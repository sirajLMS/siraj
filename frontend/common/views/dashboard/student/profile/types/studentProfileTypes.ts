export interface StudentProfileRow {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly avatarUrl: string | null;
  readonly dateOfBirth: string | null;
  readonly gender: string | null;
  readonly language: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly parentId: string | null;
  readonly parentUserId: string | null;
  readonly parentName: string | null;
  readonly parentEmail: string | null;
  readonly parentPhone: string | null;
  readonly isAssociatedViewer: boolean;
  readonly primaryTeacherId: string | null;
  readonly teacherUserId: string | null;
  readonly teacherName: string | null;
  readonly hoursPerWeek: number | null;
  readonly classesRemaining: number | null;
  readonly classesTotal: number | null;
  readonly version: number;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}
