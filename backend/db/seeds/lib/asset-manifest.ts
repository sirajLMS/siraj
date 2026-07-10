import { MEETING_PROVIDER_CATALOG_SEEDS } from "@/backend/db/seeds/lib/meeting-provider-factory";
import {
  MOBILE_WALLET_CATALOG_SEEDS,
  ONLINE_ACCOUNT_CATALOG_SEEDS,
  PAYMENT_LINK_CATALOG_SEEDS,
} from "@/backend/db/seeds/lib/payment-catalog-factory";

export type SeedAssetEntry = {
  readonly relativePath: string;
  readonly required: boolean;
  readonly description: string;
};

function avatarAssets(dir: string, count: number, required: boolean): SeedAssetEntry[] {
  return Array.from({ length: count }, (_, index) => {
    const fileName = `${String(index + 1).padStart(2, "0")}.png`;
    return {
      relativePath: `avatars/${dir}/${fileName}`,
      required,
      description: `${dir} avatar ${fileName}`,
    };
  });
}

function logoAssets(category: "meeting" | "payment", slugs: readonly string[]): SeedAssetEntry[] {
  return slugs.map(slug => ({
    relativePath: `logos/${category}/${slug}.png`,
    required: false,
    description: `${category} logo for ${slug}`,
  }));
}

const PAYMENT_LOGO_SLUGS = [
  ...MOBILE_WALLET_CATALOG_SEEDS.map(spec => spec.slug),
  ...PAYMENT_LINK_CATALOG_SEEDS.map(spec => spec.slug),
  ...ONLINE_ACCOUNT_CATALOG_SEEDS.map(spec => spec.slug),
] as const;

const MEETING_LOGO_SLUGS = MEETING_PROVIDER_CATALOG_SEEDS.map(spec => spec.slug);

export const SEED_ASSET_MANIFEST: readonly SeedAssetEntry[] = [
  ...avatarAssets("teachers", 4, true),
  ...avatarAssets("parents", 4, true),
  ...avatarAssets("students", 8, true),
  ...logoAssets("meeting", MEETING_LOGO_SLUGS),
  ...logoAssets("payment", PAYMENT_LOGO_SLUGS),
  {
    relativePath: "logos/subjects/tajweed.png",
    required: false,
    description: "class subject avatar for tajweed",
  },
  {
    relativePath: "logos/subjects/hifz.png",
    required: false,
    description: "class subject avatar for hifz",
  },
  {
    relativePath: "logos/subjects/arabic-reading.png",
    required: false,
    description: "class subject avatar for arabic-reading",
  },
  {
    relativePath: "logos/subjects/seerah.png",
    required: false,
    description: "class subject avatar for seerah",
  },
  {
    relativePath: "documents/sample-invoice.pdf",
    required: true,
    description: "sample invoice PDF for billing seeds",
  },
  {
    relativePath: "documents/sample-resource.pdf",
    required: true,
    description: "sample learning resource PDF",
  },
  {
    relativePath: "documents/sample-attachment.pdf",
    required: false,
    description: "generic attachment PDF",
  },
  {
    relativePath: "teacher_handbook/teacher-handbook.pdf",
    required: false,
    description: "teacher handbook PDF",
  },
] as const;
