import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { cachedRead, invalidateParentWrite, invalidateTag } from "@/backend/services/cache";

interface TestKeys {
  parentDirKey: string;
  teacherDirKey: string;
  parentByUserIdKey: string;
  parentDashKey: string;
}

function buildTestKeys(uid: string, userId: string, parentId: string): TestKeys {
  return {
    parentDirKey: `ec:parent:dir:parent:${uid}`,
    teacherDirKey: `ec:teacher:dir:teacher:${uid}`,
    parentByUserIdKey: `ec:parent:byUserId:${userId}:parent`,
    parentDashKey: `ec:parent:dash:metrics:${parentId}`,
  };
}

async function primeCacheEntries(keys: TestKeys, uid: string, userId: string, parentId: string): Promise<void> {
  const parentDirData = await cachedRead(keys.parentDirKey, 60, async () => ({ type: "parent-dir", uid }), [
    "parentDirectory",
  ]);
  expect(parentDirData.uid).toBe(uid);

  const teacherDirData = await cachedRead(keys.teacherDirKey, 60, async () => ({ type: "teacher-dir", uid }), [
    "teacherDirectory",
  ]);
  expect(teacherDirData.uid).toBe(uid);

  const parentByUserIdData = await cachedRead(
    keys.parentByUserIdKey,
    60,
    async () => ({ type: "parent-by-user-id", uid }),
    [`parent:byUserId:${userId}`]
  );
  expect(parentByUserIdData.uid).toBe(uid);

  const parentDashData = await cachedRead(keys.parentDashKey, 60, async () => ({ type: "parent-dash", uid }), [
    `parent:dash:metrics:${parentId}`,
  ]);
  expect(parentDashData.uid).toBe(uid);
}

async function verifyTagInvalidation(keys: TestKeys, uid: string): Promise<void> {
  await invalidateTag("parentDirectory");

  let parentDirLoaderRan = false;
  await cachedRead(
    keys.parentDirKey,
    60,
    async () => {
      parentDirLoaderRan = true;
      return { type: "parent-dir-fresh", uid };
    },
    ["parentDirectory"]
  );
  expect(parentDirLoaderRan).toBe(true);

  let teacherDirLoaderRan = false;
  await cachedRead(
    keys.teacherDirKey,
    60,
    async () => {
      teacherDirLoaderRan = true;
      return { type: "teacher-dir-fresh", uid };
    },
    ["teacherDirectory"]
  );
  expect(teacherDirLoaderRan).toBe(false);
}

async function verifyParentWriteInvalidation(
  keys: TestKeys,
  uid: string,
  userId: string,
  parentId: string
): Promise<void> {
  await invalidateParentWrite(parentId, userId);

  let parentByUserIdLoaderRan = false;
  await cachedRead(
    keys.parentByUserIdKey,
    60,
    async () => {
      parentByUserIdLoaderRan = true;
      return { type: "parent-by-user-id-fresh", uid };
    },
    [`parent:byUserId:${userId}`]
  );
  expect(parentByUserIdLoaderRan).toBe(true);

  let parentDashLoaderRan = false;
  await cachedRead(
    keys.parentDashKey,
    60,
    async () => {
      parentDashLoaderRan = true;
      return { type: "parent-dash-fresh", uid };
    },
    [`parent:dash:metrics:${parentId}`]
  );
  expect(parentDashLoaderRan).toBe(true);

  let teacherDirLoaderRan = false;
  await cachedRead(
    keys.teacherDirKey,
    60,
    async () => {
      teacherDirLoaderRan = true;
      return { type: "teacher-dir-fresh", uid };
    },
    ["teacherDirectory"]
  );
  expect(teacherDirLoaderRan).toBe(false);
}

describe("Cache Tag Invalidation Integration", () => {
  it("should invalidate tag indices and drop tagged entries correctly", async () => {
    const uid = randomUUID();
    const userId = `usr_${uid}`;
    const parentId = `par_${uid}`;
    const keys = buildTestKeys(uid, userId, parentId);

    await primeCacheEntries(keys, uid, userId, parentId);
    await verifyTagInvalidation(keys, uid);
    await verifyParentWriteInvalidation(keys, uid, userId, parentId);
  });
});
