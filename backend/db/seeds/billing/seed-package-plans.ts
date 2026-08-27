import { logger } from "@/backend/lib/logger";
import { PackagePlanService } from "@/backend/services";
import { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Package plan catalog seeds — the predefined credit-hour bundles admins can
 * attach to hour-purchase payments. Idempotent via ensure-by-codename.
 */
interface PackagePlanSeedSpec {
  readonly codename: string;
  readonly displayName: string;
  readonly description: string;
  readonly creditHours: number;
  readonly priceAmount: number;
  readonly currency: CurrencyCode;
  readonly validityMonths: number | null;
  readonly active: boolean;
  readonly sortOrder: number;
}

const PACKAGE_PLAN_SEEDS: readonly PackagePlanSeedSpec[] = [
  {
    codename: "STARTER_10H",
    displayName: "Starter 10h",
    description: "Entry bundle for trial students exploring hour-based billing.",
    creditHours: 10,
    priceAmount: 250,
    currency: CurrencyCode.USD,
    validityMonths: 3,
    active: true,
    sortOrder: 10,
  },
  {
    codename: "STANDARD_20H",
    displayName: "Standard 20h",
    description: "Most popular weekly cadence — two 90-minute sessions a week.",
    creditHours: 20,
    priceAmount: 450,
    currency: CurrencyCode.USD,
    validityMonths: 6,
    active: true,
    sortOrder: 20,
  },
  {
    codename: "INTENSIVE_40H",
    displayName: "Intensive 40h",
    description: "Exam-prep intensive with priority scheduling slots.",
    creditHours: 40,
    priceAmount: 800,
    currency: CurrencyCode.USD,
    validityMonths: 6,
    active: true,
    sortOrder: 30,
  },
  {
    codename: "ENTERPRISE_100H",
    displayName: "100-Hour Enterprise",
    description: "Bulk bundle for schools and sponsor-funded cohorts.",
    creditHours: 100,
    priceAmount: 1800,
    currency: CurrencyCode.USD,
    validityMonths: 12,
    active: true,
    sortOrder: 40,
  },
  {
    codename: "LEGACY_5H",
    displayName: "Legacy 5h",
    description: "Retired starter pack kept for historical payment references.",
    creditHours: 5,
    priceAmount: 150,
    currency: CurrencyCode.USD,
    validityMonths: null,
    active: false,
    sortOrder: 90,
  },
];

export async function seedOrGet() {
  logger.info("Seeding package plans...");
  const results = await PackagePlanService.ensureManyByCodename(PACKAGE_PLAN_SEEDS);
  logger.info(`Package plans seeded (${results.length} rows).`);
  return results;
}
