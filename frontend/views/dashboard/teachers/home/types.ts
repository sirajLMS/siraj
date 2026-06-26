export interface TeacherDirectoryRow {
  readonly id: string;
  readonly index: string;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string;
  readonly status: "active" | "offline";
  readonly zoomLink: string | null;
}

export interface TeacherMetrics {
  readonly activated: number;
  readonly deactivated: number;
}
