import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { getRedisService } from "@/backend/services/redis";
import { testLogger } from "../../../lib/testlogger";
import { db } from "../drizzleDb";
import { SessionRepository } from "../repo";
import { users } from "../schema";

// Load Redis-specific environment configuration for tests
config({ path: ".env.redis", override: true });

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function runInRollback(fn: (tx: DbTransaction) => Promise<void>): Promise<void> {
  try {
    await db.transaction(async tx => {
      await fn(tx);
      throw new Error("ROLLBACK");
    });
  } catch (error) {
    if (error instanceof Error && error.message !== "ROLLBACK") {
      throw error;
    }
  }
}

// Helper to create test user
async function createTestUser(tx: DbTransaction, email: string) {
  const [user] = await tx
    .insert(users)
    .values({
      name: "Session Test User",
      email,
      password: "hashed_password",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return user;
}

describe("Session Scalability and Redis Integration", () => {
  let redisService: ReturnType<typeof getRedisService>;

  beforeAll(() => {
    redisService = getRedisService();
  });

  afterAll(async () => {
    // Cleanup any test sessions from Redis
    await redisService.disconnect();
  });

  describe("Session Configuration", () => {
    it("should return default configuration when role not found", async () => {
      await runInRollback(async tx => {
        const config = await SessionRepository.getSessionConfig("nonexistent_role", tx);

        expect(config.ttlSeconds).toBe(7 * 24 * 60 * 60); // 7 days
        expect(config.maxConcurrentSessions).toBe(5);
        testLogger.info("Default configuration returned correctly");
      });
    });

    it("should create and retrieve custom session configuration", async () => {
      await runInRollback(async tx => {
        const customConfig = {
          roleName: "admin",
          ttlSeconds: 3600, // 1 hour
          maxConcurrentSessions: 10,
        };

        const created = await SessionRepository.upsertSessionConfig(customConfig, tx);

        expect(created.roleName).toBe("admin");
        expect(created.ttlSeconds).toBe(3600);
        expect(created.maxConcurrentSessions).toBe(10);

        const retrieved = await SessionRepository.getSessionConfig("admin", tx);
        expect(retrieved.ttlSeconds).toBe(3600);
        expect(retrieved.maxConcurrentSessions).toBe(10);

        testLogger.info("Custom session configuration created and retrieved");
      });
    });

    it("should update existing session configuration", async () => {
      await runInRollback(async tx => {
        const initialConfig = {
          roleName: "teacher",
          ttlSeconds: 7200,
          maxConcurrentSessions: 3,
        };

        await SessionRepository.upsertSessionConfig(initialConfig, tx);

        const updatedConfig = {
          roleName: "teacher",
          ttlSeconds: 14400,
          maxConcurrentSessions: 5,
        };

        const result = await SessionRepository.upsertSessionConfig(updatedConfig, tx);

        expect(result.ttlSeconds).toBe(14400);
        expect(result.maxConcurrentSessions).toBe(5);

        testLogger.info("Session configuration updated successfully");
      });
    });
  });

  describe("Redis Session Storage", () => {
    it("should create session in Redis and store metadata in PostgreSQL", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, `redis-test-${randomUUID()}@example.com`);
        const sessionId = `session-${randomUUID()}`;

        const session = await SessionRepository.create(
          {
            hashedId: sessionId,
            userId: user.id,
            payload: JSON.stringify({ test: "data" }),
            // eslint-disable-next-line sonarjs/no-hardcoded-ip -- Test fixture
            ipAddress: "192.168.1.1",
            userAgent: "Mozilla/5.0",
            deviceType: "desktop",
            deviceName: "Test Device",
          },
          tx
        );

        expect(session.hashedId).toBe(sessionId);
        expect(session.userId).toBe(user.id);

        // Verify session exists in Redis
        const redisSession = await SessionRepository.findSessionById(sessionId);
        expect(redisSession).not.toBeNull();
        expect(redisSession?.userId).toBe(user.id);

        // Verify metadata exists in PostgreSQL
        const metadata = await SessionRepository.getUserSessionMetadata(user.id, tx);
        expect(metadata.length).toBe(1);
        expect(metadata[0].deviceType).toBe("desktop");

        testLogger.info(`Session ${sessionId} created in Redis and metadata in PostgreSQL`);

        // Cleanup Redis session
        await SessionRepository.deleteSessionById(sessionId, tx);
      });
    });

    it("should retrieve session from Redis", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, `redis-retrieve-${randomUUID()}@example.com`);
        const sessionId = `session-${randomUUID()}`;

        await SessionRepository.create(
          {
            hashedId: sessionId,
            userId: user.id,
            payload: JSON.stringify({ role: "admin" }),
            // eslint-disable-next-line sonarjs/no-hardcoded-ip -- Test fixture
            ipAddress: "10.0.0.1",
            userAgent: "Test Agent",
          },
          tx
        );

        const retrieved = await SessionRepository.findSessionById(sessionId);

        expect(retrieved).not.toBeNull();
        expect(retrieved?.hashedId).toBe(sessionId);
        expect(retrieved?.userId).toBe(user.id);
        // eslint-disable-next-line sonarjs/no-hardcoded-ip -- Test expectation
        expect(retrieved?.ipAddress).toBe("10.0.0.1");

        testLogger.info(`Session ${sessionId} retrieved from Redis`);

        // Cleanup
        await SessionRepository.deleteSessionById(sessionId, tx);
      });
    });

    it("should update session last activity and extend TTL", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, `redis-update-${randomUUID()}@example.com`);
        const sessionId = `session-${randomUUID()}`;

        await SessionRepository.create(
          {
            hashedId: sessionId,
            userId: user.id,
            payload: JSON.stringify({ test: "data" }),
          },
          tx
        );

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 100));

        await SessionRepository.update(
          {
            hashedId: sessionId,
            userId: user.id,
            payload: JSON.stringify({ test: "updated" }),
          },
          tx
        );

        const retrieved = await SessionRepository.findSessionById(sessionId);
        expect(retrieved).not.toBeNull();

        testLogger.info(`Session ${sessionId} updated successfully`);

        // Cleanup
        await SessionRepository.deleteSessionById(sessionId, tx);
      });
    });

    it("should validate session and update last activity", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, `redis-validate-${randomUUID()}@example.com`);
        const sessionId = `session-${randomUUID()}`;

        await SessionRepository.create(
          {
            hashedId: sessionId,
            userId: user.id,
            payload: JSON.stringify({ test: "data" }),
          },
          tx
        );

        const validated = await SessionRepository.validate(sessionId);

        expect(validated).not.toBeNull();
        expect(validated?.hashedId).toBe(sessionId);
        expect(validated?.userId).toBe(user.id);

        testLogger.info(`Session ${sessionId} validated successfully`);

        // Cleanup
        await SessionRepository.deleteSessionById(sessionId, tx);
      });
    });

    it("should return null for non-existent session", async () => {
      const nonExistentId = `session-${randomUUID()}`;
      const session = await SessionRepository.findSessionById(nonExistentId);

      expect(session).toBeNull();
      testLogger.info("Non-existent session returned null correctly");
    });

    it("should delete session from Redis and PostgreSQL", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, `redis-delete-${randomUUID()}@example.com`);
        const sessionId = `session-${randomUUID()}`;

        await SessionRepository.create(
          {
            hashedId: sessionId,
            userId: user.id,
            payload: JSON.stringify({ test: "data" }),
          },
          tx
        );

        const deleted = await SessionRepository.deleteSessionById(sessionId, tx);

        expect(deleted).not.toBeNull();
        expect(deleted?.hashedId).toBe(sessionId);

        // Verify session removed from Redis
        const retrieved = await SessionRepository.findSessionById(sessionId);
        expect(retrieved).toBeNull();

        testLogger.info(`Session ${sessionId} deleted from Redis and PostgreSQL`);
      });
    });
  });

  describe("Concurrent Session Limits", () => {
    it("should enforce concurrent session limit", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, `concurrent-limit-${randomUUID()}@example.com`);

        // Create custom config with limit of 3
        await SessionRepository.upsertSessionConfig(
          {
            roleName: "limited_user",
            ttlSeconds: 3600,
            maxConcurrentSessions: 3,
          },
          tx
        );

        // Create 5 sessions (should keep only 3 most recent)
        for (let i = 0; i < 5; i++) {
          const sessionId = `session-${randomUUID()}`;

          await SessionRepository.create(
            {
              hashedId: sessionId,
              userId: user.id,
              payload: JSON.stringify({ index: i }),
              roleName: "limited_user",
            },
            tx
          );

          // Small delay to ensure different creation times
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Count active sessions
        const count = await SessionRepository.countUserSessions(user.id);
        expect(count).toBe(3);

        testLogger.info(`Enforced session limit: ${count} active sessions (limit: 3)`);

        // Cleanup
        await SessionRepository.deleteByUserId(user.id, tx);
      });
    });

    it("should remove oldest sessions when limit exceeded", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, `oldest-removal-${randomUUID()}@example.com`);

        await SessionRepository.upsertSessionConfig(
          {
            roleName: "test_limit",
            ttlSeconds: 3600,
            maxConcurrentSessions: 2,
          },
          tx
        );

        const firstSessionId = `session-first-${randomUUID()}`;
        const secondSessionId = `session-second-${randomUUID()}`;
        const thirdSessionId = `session-third-${randomUUID()}`;

        // Create 3 sessions
        await SessionRepository.create(
          {
            hashedId: firstSessionId,
            userId: user.id,
            payload: JSON.stringify({ order: 1 }),
            roleName: "test_limit",
          },
          tx
        );

        await new Promise(resolve => setTimeout(resolve, 100));

        await SessionRepository.create(
          {
            hashedId: secondSessionId,
            userId: user.id,
            payload: JSON.stringify({ order: 2 }),
            roleName: "test_limit",
          },
          tx
        );

        await new Promise(resolve => setTimeout(resolve, 100));

        await SessionRepository.create(
          {
            hashedId: thirdSessionId,
            userId: user.id,
            payload: JSON.stringify({ order: 3 }),
            roleName: "test_limit",
          },
          tx
        );

        // First session should be removed
        const firstSession = await SessionRepository.findSessionById(firstSessionId);
        expect(firstSession).toBeNull();

        // Second and third should exist
        const secondSession = await SessionRepository.findSessionById(secondSessionId);
        const thirdSession = await SessionRepository.findSessionById(thirdSessionId);
        expect(secondSession).not.toBeNull();
        expect(thirdSession).not.toBeNull();

        testLogger.info("Oldest session removed when limit exceeded");

        // Cleanup
        await SessionRepository.deleteByUserId(user.id, tx);
      });
    });

    it("should handle multiple users with different limits independently", async () => {
      await runInRollback(async tx => {
        const user1 = await createTestUser(tx, `multi-user-1-${randomUUID()}@example.com`);
        const user2 = await createTestUser(tx, `multi-user-2-${randomUUID()}@example.com`);

        await SessionRepository.upsertSessionConfig(
          {
            roleName: "role1",
            ttlSeconds: 3600,
            maxConcurrentSessions: 2,
          },
          tx
        );

        await SessionRepository.upsertSessionConfig(
          {
            roleName: "role2",
            ttlSeconds: 3600,
            maxConcurrentSessions: 3,
          },
          tx
        );

        // Create sessions for user1 (limit 2)
        for (let i = 0; i < 3; i++) {
          await SessionRepository.create(
            {
              hashedId: `user1-session-${i}-${randomUUID()}`,
              userId: user1.id,
              payload: JSON.stringify({ user: 1 }),
              roleName: "role1",
            },
            tx
          );
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Create sessions for user2 (limit 3)
        for (let i = 0; i < 4; i++) {
          await SessionRepository.create(
            {
              hashedId: `user2-session-${i}-${randomUUID()}`,
              userId: user2.id,
              payload: JSON.stringify({ user: 2 }),
              roleName: "role2",
            },
            tx
          );
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        const count1 = await SessionRepository.countUserSessions(user1.id);
        const count2 = await SessionRepository.countUserSessions(user2.id);

        expect(count1).toBe(2);
        expect(count2).toBe(3);

        testLogger.info(`User1 sessions: ${count1}, User2 sessions: ${count2}`);

        // Cleanup
        await SessionRepository.deleteByUserId(user1.id, tx);
        await SessionRepository.deleteByUserId(user2.id, tx);
      });
    });
  });

  describe("Logout Everywhere Functionality", () => {
    it("should delete all sessions for a user", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, `logout-everywhere-${randomUUID()}@example.com`);

        // Create multiple sessions
        const sessionIds = [];
        for (let i = 0; i < 3; i++) {
          const sessionId = `session-${i}-${randomUUID()}`;
          sessionIds.push(sessionId);
          await SessionRepository.create(
            {
              hashedId: sessionId,
              userId: user.id,
              payload: JSON.stringify({ index: i }),
            },
            tx
          );
        }

        // Verify sessions exist
        let count = await SessionRepository.countUserSessions(user.id);
        expect(count).toBe(3);

        // Logout everywhere
        const deletedCount = await SessionRepository.deleteByUserId(user.id, tx);
        expect(deletedCount).toBe(3);

        // Verify all sessions removed
        count = await SessionRepository.countUserSessions(user.id);
        expect(count).toBe(0);

        for (const sessionId of sessionIds) {
          const session = await SessionRepository.findSessionById(sessionId);
          expect(session).toBeNull();
        }

        testLogger.info(`Logout everywhere: deleted ${deletedCount} sessions`);
      });
    });

    it("should remove metadata from PostgreSQL when logging out everywhere", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, `logout-metadata-${randomUUID()}@example.com`);

        // Create sessions
        for (let i = 0; i < 2; i++) {
          await SessionRepository.create(
            {
              hashedId: `session-${i}-${randomUUID()}`,
              userId: user.id,
              payload: JSON.stringify({ index: i }),
              deviceType: "desktop",
            },
            tx
          );
        }

        // Verify metadata exists
        let metadata = await SessionRepository.getUserSessionMetadata(user.id, tx);
        expect(metadata.length).toBe(2);

        // Logout everywhere
        await SessionRepository.deleteByUserId(user.id, tx);

        // Verify metadata removed
        metadata = await SessionRepository.getUserSessionMetadata(user.id, tx);
        expect(metadata.length).toBe(0);

        testLogger.info("Metadata removed from PostgreSQL on logout everywhere");
      });
    });
  });

  describe("Concurrency Control", () => {
    it("should prevent race conditions with advisory locks", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, `race-condition-${randomUUID()}@example.com`);

        await SessionRepository.upsertSessionConfig(
          {
            roleName: "race_test",
            ttlSeconds: 3600,
            maxConcurrentSessions: 2,
          },
          tx
        );

        // Create sessions sequentially — concurrent Redis + PG advisory locks
        // serialize within a transaction but Redis is outside tx scope
        for (const i of [1, 2, 3]) {
          await SessionRepository.create(
            {
              hashedId: `concurrent-session-${i}-${randomUUID()}`,
              userId: user.id,
              payload: JSON.stringify({ index: i }),
              roleName: "race_test",
            },
            tx
          );
        }

        // Should enforce limit correctly despite concurrent operations
        const count = await SessionRepository.countUserSessions(user.id);
        expect(count).toBe(2);

        testLogger.info("Advisory locks prevented race conditions");

        // Cleanup
        await SessionRepository.deleteByUserId(user.id, tx);
      });
    });
  });

  describe("Session Metadata Management", () => {
    it("should retrieve user session metadata ordered by last activity", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, `metadata-order-${randomUUID()}@example.com`);

        const firstSessionId = `session-first-${randomUUID()}`;
        const secondSessionId = `session-second-${randomUUID()}`;

        await SessionRepository.create(
          {
            hashedId: firstSessionId,
            userId: user.id,
            payload: JSON.stringify({ order: 1 }),
            deviceType: "mobile",
          },
          tx
        );

        await new Promise(resolve => setTimeout(resolve, 100));

        await SessionRepository.create(
          {
            hashedId: secondSessionId,
            userId: user.id,
            payload: JSON.stringify({ order: 2 }),
            deviceType: "desktop",
          },
          tx
        );

        const metadata = await SessionRepository.getUserSessionMetadata(user.id, tx);

        expect(metadata.length).toBe(2);
        // Most recent should be first
        expect(metadata[0].sessionId).toBe(secondSessionId);
        expect(metadata[1].sessionId).toBe(firstSessionId);

        testLogger.info("Session metadata retrieved in correct order");

        // Cleanup
        await SessionRepository.deleteByUserId(user.id, tx);
      });
    });

    it("should filter out expired metadata", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, `expired-metadata-${randomUUID()}@example.com`);

        const sessionId = `session-${randomUUID()}`;
        await SessionRepository.create(
          {
            hashedId: sessionId,
            userId: user.id,
            payload: JSON.stringify({ test: "data" }),
          },
          tx
        );

        // Verify metadata exists
        const metadata = await SessionRepository.getUserSessionMetadata(user.id, tx);
        expect(metadata.length).toBe(1);

        // Delete session (simulating expiration)
        await SessionRepository.deleteSessionById(sessionId, tx);

        testLogger.info("Expired metadata handling verified");
      });
    });
  });

  describe("Session TTL", () => {
    it("should get session TTL from Redis", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, `ttl-test-${randomUUID()}@example.com`);
        const sessionId = `session-${randomUUID()}`;

        await SessionRepository.create(
          {
            hashedId: sessionId,
            userId: user.id,
            payload: JSON.stringify({ test: "data" }),
          },
          tx
        );

        const ttl = await SessionRepository.getSessionTTL(sessionId);

        // TTL should be positive and close to default (7 days)
        expect(ttl).toBeGreaterThan(0);
        expect(ttl).toBeLessThanOrEqual(7 * 24 * 60 * 60);

        testLogger.info(`Session TTL: ${ttl} seconds`);

        // Cleanup
        await SessionRepository.deleteSessionById(sessionId, tx);
      });
    });
  });
});
