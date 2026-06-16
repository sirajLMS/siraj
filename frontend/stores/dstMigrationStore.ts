// cspell:disable
import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";

export interface UpdatedSession {
  readonly id: string;
  readonly className: string;
  readonly section: string;
  readonly teacher: string;
  readonly fromTime: string;
  readonly toTime: string;
}

export interface ConflictItem {
  readonly id: string;
  readonly className: string;
  readonly message: string;
}

export interface ConflictGroup {
  readonly id: string;
  readonly teacherName: string;
  readonly conflicts: readonly ConflictItem[];
}

export interface CheckedEmptyItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

export interface DstMigrationMetrics {
  readonly totalAudited: number;
  readonly successful: number;
  readonly conflicts: number;
  readonly unchanged: number;
}

export type MigrationStatus = "idle" | "running" | "complete";

interface DstMigrationState {
  readonly metrics: DstMigrationMetrics;
  readonly updatedSessions: readonly UpdatedSession[];
  readonly conflictGroups: readonly ConflictGroup[];
  readonly checkedEmptyItems: readonly CheckedEmptyItem[];
  readonly migrationStatus: MigrationStatus;
  readonly runMigration: () => Promise<void>;
  readonly resetMigrationStatus: () => void;
}

const UPDATED_SESSIONS: UpdatedSession[] = [
  {
    id: "dst-1",
    className: "Advanced Arabic Lit - 102",
    section: "Section A",
    teacher: "Prof. Omar",
    fromTime: "09:00 AM",
    toTime: "10:00 AM",
  },
  {
    id: "dst-2",
    className: "Islamic History Foundation",
    section: "Section C",
    teacher: "Dr. Fatima",
    fromTime: "01:30 PM",
    toTime: "02:30 PM",
  },
  {
    id: "dst-3",
    className: "Web Development Bootcamp",
    section: "Intensive",
    teacher: "Mr. Zayed",
    fromTime: "04:00 PM",
    toTime: "05:00 PM",
  },
  {
    id: "dst-4",
    className: "Quranic Phonetics",
    section: "Beginners",
    teacher: "Sh. Idris",
    fromTime: "07:00 AM",
    toTime: "08:00 AM",
  },
];

const CONFLICT_GROUPS: ConflictGroup[] = [
  {
    id: "cg-1",
    teacherName: "Dr. Ahmed",
    conflicts: [
      {
        id: "c-1",
        className: "Discrete Mathematics",
        message: "The teacher will be in a class until 11:30 AM.",
      },
    ],
  },
  {
    id: "cg-2",
    teacherName: "Ms. Sarah Jane",
    conflicts: [
      {
        id: "c-2",
        className: "Creative Writing Workshop",
        message: "The teacher will be in a class until 03:00 PM.",
      },
      {
        id: "c-3",
        className: "Poetry Seminar",
        message: "Overlaps with existing lunch break schedule.",
      },
    ],
  },
  {
    id: "cg-3",
    teacherName: "Prof. Amara",
    conflicts: [
      {
        id: "c-4",
        className: "Global Economy 101",
        message: "The teacher will be in a class until 09:15 AM.",
      },
    ],
  },
];

const CHECKED_EMPTY_ITEMS: CheckedEmptyItem[] = [
  {
    id: "ce-1",
    title: "Self-Paced Async Modules",
    description: "24 Classes • No assigned live session times.",
  },
  {
    id: "ce-2",
    title: "Holiday Period Blocks",
    description: "5 Schedules • Already marked as inactive.",
  },
];

export const useDstMigrationStore = create<DstMigrationState>(set => ({
  metrics: {
    totalAudited: 184,
    successful: 142,
    conflicts: 12,
    unchanged: 30,
  },
  updatedSessions: UPDATED_SESSIONS,
  conflictGroups: CONFLICT_GROUPS,
  checkedEmptyItems: CHECKED_EMPTY_ITEMS,
  migrationStatus: "idle",
  runMigration: async () => {
    set({ migrationStatus: "running" });
    logger.info("Starting DST migration");
    await new Promise(resolve => setTimeout(resolve, 2000));
    logger.info("DST migration completed");
    set({ migrationStatus: "complete" });
  },
  resetMigrationStatus: () => {
    set({ migrationStatus: "idle" });
  },
}));
