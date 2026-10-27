export { getEntityCacheStats } from "@/backend/services/cache/__shared__/cacheStats";

import { logger } from "@/backend/lib/logger";
import { recordHitForKey, recordMissForKey } from "@/backend/services/cache/__shared__/cacheStats";
import { cacheService } from "@/backend/services/cache/CacheServiceFactory";

export const CACHE_VERSION = 1;

/** ISO 8601 date string pattern – matches dates serialised by JSON.stringify(Date) */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

/**
 * JSON reviver that converts ISO-8601 date strings back to Date objects.
 * Applied on every cache read so callers always receive Date instances,
 * regardless of whether the value was served from cache (string) or the loader
 * (Date). This eliminates the need for per-service toISOString() guards.
 */
function dateReviver(_key: string, value: unknown): unknown {
  if (typeof value === "string" && ISO_DATE_RE.test(value)) {
    return new Date(value);
  }
  return value;
}

/** Deserialize a cache payload, restoring Date objects from ISO strings. */
function cacheDeserialize(raw: string): unknown {
  return JSON.parse(raw, dateReviver);
}

/** Serialize a value to a cache payload string. */
function cacheSerialize(value: unknown): string {
  return JSON.stringify(value);
}
const CACHE_TAG_INDEX_TTL = 86400; // 24 hours
const CACHE_KEY_PREFIX_TAG = "tag:";

export interface CacheEntry<T> {
  version: number;
  data: T;
  cachedAt: number;
}

export function validateEntry<T = unknown>(entry: unknown): entry is CacheEntry<T> {
  return (
    typeof entry === "object" &&
    entry !== null &&
    !Array.isArray(entry) &&
    "version" in entry &&
    entry.version === CACHE_VERSION
  );
}

/**
 * Canonical JSON serialization for Redis entity cache keys: object keys are sorted
 * with localeCompare for stable cache keys.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    const len = value.length;
    if (len === 0) return "[]";
    const items: string[] = [];
    for (let i = 0; i < len; i++) {
      items.push(stableStringify(value[i]));
    }
    return `[${items.join(",")}]`;
  }
  const keys = Object.keys(value).toSorted((a, b) => a.localeCompare(b));
  const len = keys.length;
  if (len === 0) return "{}";
  const parts: string[] = [];
  for (let i = 0; i < len; i++) {
    const k = keys[i];
    parts.push(`${JSON.stringify(k)}:${stableStringify(Reflect.get(value, k))}`);
  }
  return `{${parts.join(",")}}`;
}

/** Parses a tag index JSON array from a cache string, returning null on failure. */
function parseTagIndex(raw: string): string[] | null {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function safeIndexTags(key: string, tags: string[]): Promise<void> {
  try {
    await Promise.all(
      tags.map(async tag => {
        const tagKey = `${CACHE_KEY_PREFIX_TAG}${tag}`;
        try {
          const raw = await cacheService.get(tagKey);
          const existing = raw ? parseTagIndex(raw) : null;
          const arr = existing ?? [];
          if (!arr.includes(key)) {
            arr.push(key);
            await cacheService.set(tagKey, JSON.stringify(arr), { ex: CACHE_TAG_INDEX_TTL });
          }
        } catch (err) {
          logger.error(`safeIndexTags failed for tag ${tag}:`, err);
        }
      })
    );
  } catch (err) {
    logger.error("safeIndexTags outer error:", err);
  }
}

/**
 * Attempt a cache read and return a typed hit result.
 *
 * This is the shared implementation extracted from {@link cachedRead} and
 * {@link cachedReadSingleFlight}. Both functions previously duplicated the
 * same ~24-line block: cache get → deserialize → validate → index tags →
 * record hit → return data (with error handling for both JSON parse and
 * cache get failures).
 *
 * @param callerName - Function name used in log messages for diagnostics.
 */
type CacheHit<T> = { hit: true; data: T } | { hit: false };

async function readFromCache<T>(key: string, tags: string[], callerName: string): Promise<CacheHit<T>> {
  let raw: string | null;
  try {
    raw = await cacheService.get(key);
  } catch (err) {
    logger.error(`${callerName} cache get failed for key ${key}:`, err);
    return { hit: false };
  }

  if (!raw) return { hit: false };

  let parsed: unknown;
  try {
    parsed = cacheDeserialize(raw);
  } catch (pErr) {
    logger.warn(`${callerName} JSON parse error for key ${key}:`, pErr);
    return { hit: false };
  }

  if (!validateEntry<T>(parsed)) return { hit: false };

  if (tags.length > 0) {
    await safeIndexTags(key, tags);
  }
  recordHitForKey(key);
  return { hit: true, data: parsed.data };
}

async function setSingleFlight(key: string, value: string, ttlSeconds: number): Promise<boolean> {
  try {
    const res = await cacheService.pipeline([{ command: "set", args: [key, value, "EX", ttlSeconds, "NX"] }]);
    return Array.isArray(res) && (res[0] === "OK" || res[0] === true);
  } catch (err) {
    logger.error(`setSingleFlight error for key ${key}:`, err);
    return false;
  }
}

async function setStandard(key: string, value: string, ttlSeconds: number): Promise<boolean> {
  await cacheService.set(key, value, { ex: ttlSeconds });
  return true;
}

async function performCachedRead<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
  tags: string[],
  callerName: string,
  writer: (key: string, serialized: string, ttl: number) => Promise<boolean>
): Promise<T> {
  if (ttlSeconds > CACHE_TAG_INDEX_TTL) {
    throw new Error("cache TTL exceeds tag index TTL");
  }

  const cached = await readFromCache<T>(key, tags, callerName);
  if (cached.hit) {
    return cached.data;
  }

  const data = await loader();
  const entry: CacheEntry<T> = { version: CACHE_VERSION, data, cachedAt: Date.now() };

  try {
    const written = await writer(key, cacheSerialize(entry), ttlSeconds);
    if (written && tags.length > 0) {
      await safeIndexTags(key, tags);
    }
    recordMissForKey(key);
  } catch (err) {
    logger.error(`${callerName} cache set failed for key ${key}:`, err);
  }

  return data;
}

export function cachedRead<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
  tags: string[] = []
): Promise<T> {
  return performCachedRead(key, ttlSeconds, loader, tags, "cachedRead", setStandard);
}

export function cachedReadSingleFlight<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
  tags: string[] = []
): Promise<T> {
  return performCachedRead(key, ttlSeconds, loader, tags, "cachedReadSingleFlight", setSingleFlight);
}

export async function invalidateTag(tag: string): Promise<void> {
  const tagKey = `${CACHE_KEY_PREFIX_TAG}${tag}`;
  try {
    let raw: string | null = null;
    try {
      raw = await cacheService.get(tagKey);
    } catch {
      raw = null;
    }

    if (!raw) {
      return;
    }

    let keys: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return;
      }
      keys = parsed;
    } catch {
      return;
    }

    if (keys.length > 0) {
      await cacheService.pipeline([
        { command: "del", args: [...keys] },
        { command: "del", args: [tagKey] },
      ]);
    } else {
      await cacheService.del(tagKey);
    }

    try {
      await cacheService.set(tagKey, "[]", { ex: CACHE_TAG_INDEX_TTL });
    } catch (sErr) {
      logger.error(`invalidateTag reset tagKey failed for tag ${tag}:`, sErr);
    }
  } catch (err) {
    logger.error(`invalidateTag failed for tag ${tag}:`, err);
  }
}

async function invalidateTags(tags: string[]): Promise<void> {
  await Promise.all(tags.map(invalidateTag));
}

export async function invalidateParentWrite(parentId: string, userId: string): Promise<void> {
  await invalidateTags([
    `parent:${parentId}`,
    `parent:byUserId:${userId}`,
    "parentDirectory",
    "dashboard:parent",
    `parent:dash:metrics:${parentId}`,
  ]);
}

export async function invalidateTeacherWrite(teacherId: string, userId: string): Promise<void> {
  await invalidateTags([
    `teacher:${teacherId}`,
    `teacher:byUserId:${userId}`,
    `user:${userId}`,
    "teacherDirectory",
    "dashboard:supervisor",
  ]);
}

export async function invalidateClassLifecycle(
  teacherId: string | undefined,
  parentId: string | undefined
): Promise<void> {
  const tags: string[] = ["dashboard:parent", "dashboard:supervisor", "teacherDirectory", "parentDirectory"];
  if (teacherId) {
    tags.push(`teacher:${teacherId}`);
  }
  if (parentId) {
    tags.push(`parent:${parentId}`, `parent:dash:metrics:${parentId}`);
  }
  await invalidateTags(tags);
}

export async function invalidateRoleChange(userId: string): Promise<void> {
  await invalidateTags([`user:${userId}`, "teacherDirectory", "parentDirectory", "dashboard:supervisor"]);
}
