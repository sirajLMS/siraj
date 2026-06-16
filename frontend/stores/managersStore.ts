import { create } from "zustand";

export interface Manager {
  id: string;
  name: string;
  role: "admin" | "staff";
  status: "active" | "offline";
  email: string;
  skypeId: string;
  phone: string;
  avatarUrl: string;
}

interface ManagersState {
  managers: Manager[];
  metrics: {
    totalAdmin: number;
    systemStaff: number;
    activeNow: number;
    alerts: number;
  };
  setManagers: (managers: Manager[]) => void;
  setMetrics: (metrics: ManagersState["metrics"]) => void;
}

const mockManagers: Manager[] = [
  [
    "MGR-01",
    "Ahmad Ali",
    "admin",
    "active",
    "a.ali@siraj-edu.com",
    "ahmad.manager.99",
    "+971 50 123 4567",
    "/demo/avatars/01.png",
  ],
  [
    "MGR-02",
    "Fatima Omar",
    "staff",
    "offline",
    "fatima.z@siraj-lms.edu",
    "live:fz_siraj",
    "+966 55 987 6543",
    "/demo/avatars/02.png",
  ],
  [
    "MGR-03",
    "Omar Ahmed",
    "staff",
    "offline",
    "omar.h@siraj-lms.edu",
    "omar_staff_siraj",
    "+966 53 444 8899",
    "/demo/avatars/03.png",
  ],
  [
    "MGR-04",
    "Sara Khalid",
    "admin",
    "active",
    "sara.k@siraj-lms.edu",
    "sara.khalid.admin",
    "+966 56 111 2233",
    "/demo/avatars/04.png",
  ],
].map(([id, name, role, status, email, skypeId, phone, avatarUrl]) => ({
  id,
  name,
  role: role as "admin" | "staff",
  status: status as "active" | "offline",
  email,
  skypeId,
  phone,
  avatarUrl,
}));

export const useManagersStore = create<ManagersState>(set => ({
  managers: mockManagers,
  metrics: {
    totalAdmin: 24,
    systemStaff: 12,
    activeNow: 8,
    alerts: 0,
  },
  setManagers: managers => {
    set({ managers });
  },
  setMetrics: metrics => {
    set({ metrics });
  },
}));
