export interface UpcomingClass {
  readonly id: string;
  readonly subject: string;
  readonly instructor: string;
  readonly date: string;
  readonly time: string;
  readonly room: string;
  readonly status: "scheduled" | "suspended" | "on-leave";
}

export interface StudentStatusInfo {
  readonly id: string;
  readonly name: string;
  readonly status: "regular" | "suspended" | "on-leave";
  readonly grade: string;
  readonly profileImage: string;
  readonly upcomingClasses: readonly UpcomingClass[];
}
