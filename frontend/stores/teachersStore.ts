// cspell:disable
import { create } from "zustand";

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

interface TeachersState {
  readonly metrics: TeacherMetrics;
  readonly rows: readonly TeacherDirectoryRow[];
  readonly totalTeachers: number;
  readonly searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const TEACHER_METRICS: TeacherMetrics = {
  activated: 124,
  deactivated: 12,
};

const MOCK_ROWS: readonly TeacherDirectoryRow[] = [
  {
    id: "tea-1",
    index: "01",
    name: "Sarah Jenkins",
    email: "s.jenkins@sirajlms.edu",
    avatarUrl: "/demo/avatars/02.png",
    status: "active",
    zoomLink: "https://zoom.us/j/123456789",
  },
  {
    id: "tea-2",
    index: "02",
    name: "Michael Chen",
    email: "m.chen@sirajlms.edu",
    avatarUrl: "/demo/avatars/01.png",
    status: "active",
    zoomLink: "https://zoom.us/j/987654321",
  },
  {
    id: "tea-3",
    index: "03",
    name: "Elena Rodriguez",
    email: "e.rodriguez@sirajlms.edu",
    avatarUrl: "/demo/avatars/04.png",
    status: "active",
    zoomLink: "https://zoom.us/j/456789123",
  },
  {
    id: "tea-4",
    index: "04",
    name: "David Miller",
    email: "d.miller@sirajlms.edu",
    avatarUrl: "/demo/avatars/03.png",
    status: "offline",
    zoomLink: null,
  },
];

export const useTeachersStore = create<TeachersState>(set => ({
  metrics: TEACHER_METRICS,
  rows: MOCK_ROWS,
  totalTeachers: 136,
  searchQuery: "",

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
}));
