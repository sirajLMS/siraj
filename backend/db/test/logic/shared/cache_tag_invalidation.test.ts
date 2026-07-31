import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { cachedRead, invalidateParentWrite, invalidateTag } from "@/backend/services/cache";

describe("Cache Tag Invalidation Integration", () => {
  it("should invalidate tag indices and drop tagged entries correctly", async () => {
    const uid = randomUUID();
    const userId = `usr_${uid}`;
    const parentId = `par_${uid}`;

    const parentDirKey = `ec:parent:dir:parent:${uid}`;
    const teacherDirKey = `ec:teacher:dir:teacher:${uid}`;
    const parentByUserIdKey = `ec:parent:byUserId:${userId}:parent`;
    const parentDashKey = `ec:parent:dash:metrics:${parentId}`;

    // Read and cache entries
    const parentDirData = await cachedRead(parentDirKey, 60, async () => ({ type: "parent-dir", uid }), [
      "parentDirectory",
    ]);
    expect(parentDirData.uid).toBe(uid);

    const teacherDirData = await cachedRead(teacherDirKey, 60, async () => ({ type: "teacher-dir", uid }), [
      "teacherDirectory",
    ]);
    expect(teacherDirData.uid).toBe(uid);

    const parentByUserIdData = await cachedRead(
      parentByUserIdKey,
      60,
      async () => ({ type: "parent-by-user-id", uid }),
      [`parent:byUserId:${userId}`]
    );
    expect(parentByUserIdData.uid).toBe(uid);

    const parentDashData = await cachedRead(parentDashKey, 60, async () => ({ type: "parent-dash", uid }), [
      `parent:dash:metrics:${parentId}`,
    ]);
    expect(parentDashData.uid).toBe(uid);

    // Invalidate parentDirectory tag specifically
    await invalidateTag("parentDirectory");

    // Re-read parentDirKey — loader should run
    let parentDirLoaderRan = false;
    await cachedRead(
      parentDirKey,
      60,
      async () => {
        parentDirLoaderRan = true;
        return { type: "parent-dir-fresh", uid };
      },
      ["parentDirectory"]
    );
    expect(parentDirLoaderRan).toBe(true);

    // Verify teacherDirectory was NOT invalidated by parentDirectory invalidation
    let teacherDirLoaderRan = false;
    await cachedRead(
      teacherDirKey,
      60,
      async () => {
        teacherDirLoaderRan = true;
        return { type: "teacher-dir-fresh", uid };
      },
      ["teacherDirectory"]
    );
    expect(teacherDirLoaderRan).toBe(false);

    // Invalidate via invalidateParentWrite(parentId, userId)
    await invalidateParentWrite(parentId, userId);

    // Verify parentByUserIdKey and parentDashKey loaders now run while teacherDirKey remains cached
    let parentByUserIdLoaderRan = false;
    await cachedRead(
      parentByUserIdKey,
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
      parentDashKey,
      60,
      async () => {
        parentDashLoaderRan = true;
        return { type: "parent-dash-fresh", uid };
      },
      [`parent:dash:metrics:${parentId}`]
    );
    expect(parentDashLoaderRan).toBe(true);

    teacherDirLoaderRan = false;
    await cachedRead(
      teacherDirKey,
      60,
      async () => {
        teacherDirLoaderRan = true;
        return { type: "teacher-dir-fresh", uid };
      },
      ["teacherDirectory"]
    );
    expect(teacherDirLoaderRan).toBe(false);
  });
});
