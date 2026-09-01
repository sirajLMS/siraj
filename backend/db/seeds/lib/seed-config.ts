type SeedProfile = "minimal" | "standard";

export interface SeedConfig {
  profile: SeedProfile;
  anchorDate: Date;
  /** Extra teachers beyond the fixed demo teacher */
  extraTeachers: number;
  /** Extra parents beyond the fixed demo parent */
  extraParents: number;
  /** Extra students beyond the two fixed demo students */
  extraStudents: number;
  daysPerWeek: number;
  monthsBefore: number;
  monthsAfter: number;
  fakerSeed: number;
  enableBilling: boolean;
  enableCommunications: boolean;
  enableAuditLogs: boolean;
  enableExtendedScheduling: boolean;
  enableExtendedFiles: boolean;
}

const PROFILE_DEFAULTS: Record<SeedProfile, Omit<SeedConfig, "profile" | "anchorDate">> = {
  minimal: {
    extraTeachers: 0,
    extraParents: 0,
    extraStudents: 0,
    daysPerWeek: 2,
    monthsBefore: 1,
    monthsAfter: 1,
    fakerSeed: 42,
    enableBilling: false,
    enableCommunications: false,
    enableAuditLogs: false,
    enableExtendedScheduling: true,
    enableExtendedFiles: false,
  },
  standard: {
    extraTeachers: 5,
    extraParents: 9,
    extraStudents: 18,
    daysPerWeek: 2,
    monthsBefore: 6,
    monthsAfter: 6,
    fakerSeed: 42,
    enableBilling: true,
    enableCommunications: true,
    enableAuditLogs: true,
    enableExtendedScheduling: true,
    enableExtendedFiles: true,
  },
};

function parseSeedProfile(): SeedProfile {
  const raw = process.env.SEED_PROFILE?.toLowerCase();
  if (raw === "minimal" || raw === "standard") {
    return raw;
  }
  return "standard";
}

function parseAnchorDate(): Date {
  const raw = process.env.SEED_ANCHOR_DATE;
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

export function loadSeedConfig(): SeedConfig {
  const profile = parseSeedProfile();
  const defaults = PROFILE_DEFAULTS[profile];

  return {
    profile,
    anchorDate: parseAnchorDate(),
    ...defaults,
  };
}

export function getTotalStudents(config: SeedConfig): number {
  return 2 + config.extraStudents;
}
