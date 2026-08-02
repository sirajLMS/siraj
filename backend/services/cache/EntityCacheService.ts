import { CacheDbRepository } from "@/backend/db/repo/shared/cache.repository";
import logger from "@/backend/lib/logger";
import { cacheService, getCacheService } from "@/backend/services/cache/CacheServiceFactory";
import { PostgresCacheAdapter } from "@/backend/services/cache/PostgresCacheAdapter";

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
export const CACHE_TAG_INDEX_TTL = 86400; // 24 hours
export const CACHE_KEY_PREFIX_ENTITY = "ec:";
export const CACHE_KEY_PREFIX_TAG = "tag:";

export interface CacheEntry<T> {
  version: number;
  data: T;
  cachedAt: number;
}

export interface CacheStats {
  provider: string;
  size: number;
  hitsByPrefix: Record<string, { hits: number; misses: number }>;
}

/**
 * Maximum number of entries allowed in hitMissMap.
 * Normal usage derives a finite set of prefixes via prefixOf(), so this cap
 * is a safety net — it prevents unbounded growth if keys with unexpected
 * prefixes are introduced. When the limit is exceeded, oldest entries are
 * evicted first.
 */
const MAX_HIT_MISS_ENTRIES = 100;

const hitMissMap = new Map<string, { hits: number; misses: number }>();

function prefixOf(key: string): string {
  if (key.startsWith("ec:")) {
    const rest = key.slice(3);
    if (rest.startsWith("parent:dash:metrics:")) return "parent:dash:metrics";
    if (rest.startsWith("supervisor:dash:")) return "supervisor:dash";
    if (rest.startsWith("parent:dir:")) return "parent:dir";
    if (rest.startsWith("teacher:dir:")) return "teacher:dir";
    if (rest.startsWith("teacher:byUserId:")) return "teacher:byUserId";
    if (rest.startsWith("parent:byUserId:")) return "parent:byUserId";
    const parts = rest.split(":");
    return parts[0] || "general";
  }
  if (key.startsWith("tag:")) {
    return "tag";
  }
  const parts = key.split(":");
  return parts[0] || "general";
}

/**
 * Enforce the MAX_HIT_MISS_ENTRIES cap by deleting oldest entries.
 * Map preserves insertion order, so we delete the first N excess entries.
 */
function enforceHitMissCap(): void {
  const excess = hitMissMap.size - MAX_HIT_MISS_ENTRIES;
  if (excess > 0) {
    for (const key of hitMissMap.keys()) {
      hitMissMap.delete(key);
      if (hitMissMap.size <= MAX_HIT_MISS_ENTRIES) break;
    }
  }
}

function recordHit(prefix: string): void {
  const current = hitMissMap.get(prefix) ?? { hits: 0, misses: 0 };
  hitMissMap.set(prefix, { hits: current.hits + 1, misses: current.misses });
  enforceHitMissCap();
}

function recordMiss(prefix: string): void {
  const current = hitMissMap.get(prefix) ?? { hits: 0, misses: 0 };
  hitMissMap.set(prefix, { hits: current.hits, misses: current.misses + 1 });
  enforceHitMissCap();
}

export function getEntityCacheStats(): Record<string, { hits: number; misses: number }> {
  return Object.fromEntries(hitMissMap);
}

export function validateEntry(entry: unknown): entry is CacheEntry<unknown> {
  return (
    typeof entry === "object" &&
    entry !== null &&
    !Array.isArray(entry) &&
    (entry as CacheEntry<unknown>).version === CACHE_VERSION
  );
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    const items = value.map(stableStringify).join(",");
    return `[${items}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const entries = keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",");
  return `{${entries}}`;
}

export async function safeIndexTags(key: string, tags: string[]): Promise<void> {
  try {
    for (const tag of tags) {
      const tagKey = `${CACHE_KEY_PREFIX_TAG}${tag}`;
      try {
        const raw = await cacheService.get(tagKey);
        let arr: string[] = [];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              arr = parsed;
            }
          } catch {
            arr = [];
          }
        }
        if (!arr.includes(key)) {
          arr.push(key);
          await cacheService.set(tagKey, JSON.stringify(arr), { ex: CACHE_TAG_INDEX_TTL });
        }
      } catch (err) {
        logger.error(`safeIndexTags failed for tag ${tag}:`, err);
      }
    }
  } catch (err) {
    logger.error("safeIndexTags outer error:", err);
  }
}

export async function cachedRead<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
  tags: string[] = []
): Promise<T> {
  if (ttlSeconds > CACHE_TAG_INDEX_TTL) {
    throw new Error("cache TTL exceeds tag index TTL");
  }

  try {
    const raw = await cacheService.get(key);
    if (raw) {
      try {
        const parsed = cacheDeserialize(raw);
        if (validateEntry(parsed)) {
          if (tags.length > 0) {
            await safeIndexTags(key, tags);
          }
          recordHit(prefixOf(key));
          return parsed.data as T;
        }
      } catch (pErr) {
        logger.warn(`cachedRead JSON parse error for key ${key}:`, pErr);
      }
    }
  } catch (err) {
    logger.error(`cachedRead cache get failed for key ${key}:`, err);
  }

  const data = await loader();
  const entry: CacheEntry<T> = { version: CACHE_VERSION, data, cachedAt: Date.now() };

  try {
    await cacheService.set(key, cacheSerialize(entry), { ex: ttlSeconds });
    if (tags.length > 0) {
      await safeIndexTags(key, tags);
    }
    recordMiss(prefixOf(key));
  } catch (err) {
    logger.error(`cachedRead cache set failed for key ${key}:`, err);
  }

  return data;
}

async function setSingleFlight(key: string, value: string, ttlSeconds: number): Promise<boolean> {
  try {
    const service = await getCacheService();
    if (service instanceof PostgresCacheAdapter) {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      return await CacheDbRepository.insertIfNotExists(key, value, expiresAt);
    }
    const res = await cacheService.pipeline([{ command: "set", args: [key, value, "EX", ttlSeconds, "NX"] }]);
    return Array.isArray(res) && (res[0] === "OK" || res[0] === true);
  } catch (err) {
    logger.error(`setSingleFlight error for key ${key}:`, err);
    return false;
  }
}

export async function cachedReadSingleFlight<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
  tags: string[] = []
): Promise<T> {
  if (ttlSeconds > CACHE_TAG_INDEX_TTL) {
    throw new Error("cache TTL exceeds tag index TTL");
  }

  try {
    const raw = await cacheService.get(key);
    if (raw) {
      try {
        const parsed = cacheDeserialize(raw);
        if (validateEntry(parsed)) {
          if (tags.length > 0) {
            await safeIndexTags(key, tags);
          }
          recordHit(prefixOf(key));
          return parsed.data as T;
        }
      } catch (pErr) {
        logger.warn(`cachedReadSingleFlight JSON parse error for key ${key}:`, pErr);
      }
    }
  } catch (err) {
    logger.error(`cachedReadSingleFlight cache get failed for key ${key}:`, err);
  }

  const data = await loader();
  const entry: CacheEntry<T> = { version: CACHE_VERSION, data, cachedAt: Date.now() };

  try {
    const inserted = await setSingleFlight(key, cacheSerialize(entry), ttlSeconds);
    if (inserted && tags.length > 0) {
      await safeIndexTags(key, tags);
    }
    recordMiss(prefixOf(key));
  } catch (err) {
    logger.error(`cachedReadSingleFlight cache set failed for key ${key}:`, err);
  }

  return data;
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

export async function invalidateTags(tags: string[]): Promise<void> {
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
