export type ProfileLabels = {
  readonly shell: {
    readonly error: {
      readonly retry: string;
    };
    readonly tabs: {
      readonly profile: string;
      readonly banking: string;
      readonly students: string;
      readonly notifications: string;
      readonly permissions: string;
    };
    readonly loading: string;
  };
  readonly role: {
    readonly teacher: string;
    readonly parent: string;
    readonly staff: string;
  };
  readonly tab: {
    readonly overview: string;
    readonly students: string;
    readonly billing: string;
    readonly classes: string;
    readonly schedule: string;
    readonly settings: string;
    readonly payments: string;
    readonly history: string;
    readonly editing: string;
    readonly reassignment: string;
  };
};

export const profileLabels = {
  shell: {
    error: {
      retry: "Please refresh the page or try again later.",
    },
  },
  role: {
    teacher: "Teacher",
    parent: "Parent",
    staff: "Staff",
  },
  tab: {
    overview: "Overview",
    students: "Students",
    billing: "Billing",
    classes: "Classes",
    schedule: "Schedule",
    settings: "Settings",
    payments: "Payments",
    history: "History",
    editing: "Editing",
    reassignment: "Reassignment",
  },
};
