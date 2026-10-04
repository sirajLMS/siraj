/**
 * CLDR loading, validation, and Arabic label/territory builders for
 * scripts/generate-iana-timezone-enum.ts.
 */

import { readFileSync } from "node:fs";
import {
  CITY_ALIASES,
  CLDR_AR_TERRITORIES_PATH,
  CLDR_AR_TIMEZONES_PATH,
  CLDR_WINDOWS_ZONES_PATH,
  EXCLUDED_TERRITORY_CODES,
  type IanaTimezoneLabels,
  REGION_LABELS_AR,
  SEGMENT_STATIC_AR,
  SEGMENT_TERRITORY,
  TERRITORY_OVERRIDES,
} from "@/scripts/generate-iana-timezone-enum.constants";
import { isExcludedIanaTimezoneId } from "@/shared/lib/timezone/excluded-iana-timezones";

type CldrZoneNode = {
  readonly exemplarCity?: string;
  readonly short?: { readonly standard?: string };
  readonly long?: { readonly standard?: string };
};

type CldrZoneTree = Record<string, unknown>;

type CldrZoneTreeData = {
  readonly main: { readonly ar: { readonly dates: { readonly timeZoneNames: { readonly zone: CldrZoneTree } } } };
};

type CldrTerritoriesData = {
  readonly main: {
    readonly ar: { readonly localeDisplayNames: { readonly territories: Record<string, string> } };
  };
};

type CldrWindowsZonesData = {
  readonly supplemental: {
    readonly windowsZones: {
      readonly mapTimezones: ReadonlyArray<{
        readonly mapZone: { readonly _type: string; readonly _territory: string };
      }>;
    };
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((v): v is string => typeof v === "string");
}

function isCldrZoneNode(value: unknown): value is CldrZoneNode {
  if (!isRecord(value)) return false;
  if (value.exemplarCity !== undefined && typeof value.exemplarCity !== "string") return false;
  return true;
}

function isCldrZoneTreeData(data: unknown): data is CldrZoneTreeData {
  if (!isRecord(data)) return false;
  const mainData = data.main;
  if (!isRecord(mainData)) return false;
  const ar = mainData.ar;
  if (!isRecord(ar)) return false;
  const dates = ar.dates;
  if (!isRecord(dates)) return false;
  const timeZoneNames = dates.timeZoneNames;
  if (!isRecord(timeZoneNames)) return false;
  return isRecord(timeZoneNames.zone);
}

function isCldrTerritoriesData(data: unknown): data is CldrTerritoriesData {
  if (!isRecord(data)) return false;
  const mainData = data.main;
  if (!isRecord(mainData)) return false;
  const ar = mainData.ar;
  if (!isRecord(ar)) return false;
  const localeDisplayNames = ar.localeDisplayNames;
  if (!isRecord(localeDisplayNames)) return false;
  return isStringRecord(localeDisplayNames.territories);
}

function isCldrWindowsZonesData(data: unknown): data is CldrWindowsZonesData {
  if (!isRecord(data)) return false;
  const supplemental = data.supplemental;
  if (!isRecord(supplemental)) return false;
  const windowsZones = supplemental.windowsZones;
  if (!isRecord(windowsZones)) return false;
  const mapTimezones = windowsZones.mapTimezones;
  if (!Array.isArray(mapTimezones)) return false;
  return mapTimezones.every(entry => {
    if (!isRecord(entry)) return false;
    const mapZone = entry.mapZone;
    if (!isRecord(mapZone)) return false;
    const { _type, _territory } = mapZone;
    return typeof _type === "string" && typeof _territory === "string";
  });
}

export function ianaIdToEnumKey(ianaId: string): string {
  return ianaId.replace(/\//g, "_").replace(/-/g, "_").replace(/\+/g, "_plus_");
}

export function getIanaTimezoneIds(): string[] {
  if (typeof Intl.supportedValuesOf !== "function") {
    throw new Error("Intl.supportedValuesOf is not available in this runtime");
  }
  return [...Intl.supportedValuesOf("timeZone")]
    .filter(id => !isExcludedIanaTimezoneId(id))
    .toSorted((a, b) => a.localeCompare(b));
}

function loadCldrZoneTree(): CldrZoneTree {
  const parsed: unknown = JSON.parse(readFileSync(CLDR_AR_TIMEZONES_PATH, "utf8"));
  if (!isCldrZoneTreeData(parsed)) {
    throw new Error("Invalid CLDR timezone names data structure");
  }
  return parsed.main.ar.dates.timeZoneNames.zone;
}

function loadCldrTerritories(): Record<string, string> {
  const parsed: unknown = JSON.parse(readFileSync(CLDR_AR_TERRITORIES_PATH, "utf8"));
  if (!isCldrTerritoriesData(parsed)) {
    throw new Error("Invalid CLDR territories data structure");
  }
  return parsed.main.ar.localeDisplayNames.territories;
}

function loadCldrTimezoneTerritories(): Record<string, string> {
  const parsed: unknown = JSON.parse(readFileSync(CLDR_WINDOWS_ZONES_PATH, "utf8"));
  if (!isCldrWindowsZonesData(parsed)) {
    throw new Error("Invalid CLDR windows zones data structure");
  }
  const territories: Record<string, string> = {};
  for (const entry of parsed.supplemental.windowsZones.mapTimezones) {
    const { _type, _territory } = entry.mapZone;
    if (_territory === "001" || _territory === "ZZ") {
      continue;
    }
    for (const timezoneId of _type.split(" ")) {
      if (!territories[timezoneId]) {
        territories[timezoneId] = _territory;
      }
    }
  }
  return territories;
}

function walkCldrPath(root: CldrZoneTree, segments: readonly string[]): CldrZoneNode | null {
  let node: unknown = root;
  for (const segment of segments) {
    if (!isRecord(node) || !(segment in node)) {
      return null;
    }
    node = node[segment];
  }
  return isCldrZoneNode(node) ? node : null;
}

function humanizeSegment(segment: string): string {
  return segment.replace(/_/g, " ");
}

function resolveSegmentLabel(
  segment: string,
  isLast: boolean,
  region: string,
  cldrZones: CldrZoneTree,
  territories: Record<string, string>
): string {
  if (SEGMENT_STATIC_AR[segment]) {
    return SEGMENT_STATIC_AR[segment];
  }

  const territoryCode = SEGMENT_TERRITORY[segment];
  if (territoryCode && territories[territoryCode]) {
    return territories[territoryCode];
  }

  if (isLast) {
    const alias = CITY_ALIASES[segment] ?? segment;
    const flatNode = walkCldrPath(cldrZones, [region, alias]);
    if (flatNode?.exemplarCity) {
      return flatNode.exemplarCity;
    }
  }

  return humanizeSegment(segment);
}

function buildArabicPathLabel(ianaId: string, cldrZones: CldrZoneTree, territories: Record<string, string>): string {
  if (ianaId === "UTC") {
    const utcNode = walkCldrPath(cldrZones, ["Etc", "UTC"]);
    return utcNode?.short?.standard ?? "UTC";
  }

  const segments = ianaId.split("/");
  const region = segments[0];
  const regionAr = REGION_LABELS_AR[region] ?? region;

  if (segments.length === 1) {
    return regionAr;
  }

  const locationSegments = segments.slice(1);
  const arLocationParts: string[] = [];

  for (let index = 0; index < locationSegments.length; index++) {
    const segment = locationSegments[index];
    const pathToHere = [region, ...locationSegments.slice(0, index + 1)];
    const node = walkCldrPath(cldrZones, pathToHere);

    if (node?.exemplarCity) {
      arLocationParts.push(node.exemplarCity);
      continue;
    }

    if (index === locationSegments.length - 1) {
      const alias = CITY_ALIASES[segment] ?? segment;
      const flatNode = walkCldrPath(cldrZones, [region, alias]);
      if (flatNode?.exemplarCity) {
        arLocationParts.push(flatNode.exemplarCity);
        continue;
      }
    }

    arLocationParts.push(
      resolveSegmentLabel(segment, index === locationSegments.length - 1, region, cldrZones, territories)
    );
  }

  return [regionAr, ...arLocationParts].join("/");
}

export function buildIanaTimezoneLabels(ids: string[]): Record<string, IanaTimezoneLabels> {
  const cldrZones = loadCldrZoneTree();
  const territories = loadCldrTerritories();
  const labels: Record<string, IanaTimezoneLabels> = {};

  for (const id of ids) {
    labels[id] = {
      en: id,
      ar: buildArabicPathLabel(id, cldrZones, territories),
    };
  }

  return labels;
}

export function buildIanaTimezoneTerritories(ids: string[]): Record<string, string | null> {
  const cldrTerritories = loadCldrTimezoneTerritories();
  const territories: Record<string, string | null> = {};
  for (const id of ids) {
    if (id in TERRITORY_OVERRIDES) {
      territories[id] = TERRITORY_OVERRIDES[id];
      continue;
    }
    if (id.startsWith("Etc/GMT")) {
      territories[id] = null;
      continue;
    }
    const territoryCode = cldrTerritories[id] ?? null;
    territories[id] = territoryCode && EXCLUDED_TERRITORY_CODES.has(territoryCode) ? "PS" : territoryCode;
  }
  return territories;
}
