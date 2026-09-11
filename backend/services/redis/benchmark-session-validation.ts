import { logger } from "@/backend/lib/logger";
import type { IRedisService } from "@/backend/services/redis/IRedisService";
import { SessionRedisService } from "@/backend/services/redis/SessionRedisService";

const mockRedis = {
  get: async () => null,
  set: async () => {},
  del: async () => 1,
  exists: async () => 0,
  expire: async () => 1,
  ttl: async () => 3600,
};

const service = new SessionRedisService(mockRedis as unknown as IRedisService);

const sampleValidSession = {
  userId: "usr_1029384756",
  hashedId: "hash_9876543210",
  payload: "encrypted_payload_string_sample_data",
  ipAddress: "127.0.0.1",
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  deviceType: "desktop",
  deviceName: "Chrome on macOS",
  createdAt: "2025-01-15T10:00:00.000Z",
  lastActivityAt: "2025-01-15T10:30:00.000Z",
  impersonation: {
    targetUserId: "usr_5555555555",
    startedAt: "2025-01-15T10:00:00.000Z",
    expiresAt: "2025-01-15T11:00:00.000Z",
    reason: "Investigating support ticket #1234",
    impersonationSessionId: "imp_999999",
  },
  groupSimulation: {
    groupSlug: "super_admin",
    startedAt: "2025-01-15T10:00:00.000Z",
    expiresAt: "2025-01-15T11:00:00.000Z",
  },
};

// Access private method via method reference
const serviceInstance = service as unknown as {
  validateSessionData: (data: unknown, id: string) => boolean;
};
const validateSessionData = serviceInstance.validateSessionData.bind(serviceInstance);

const ITERATIONS = 5_000_000;

// Warmup
for (let i = 0; i < 100_000; i++) {
  validateSessionData(sampleValidSession, "sess_benchmark");
}

const start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  validateSessionData(sampleValidSession, "sess_benchmark");
}
const end = performance.now();

const durationMs = end - start;
const opsPerSec = (ITERATIONS / durationMs) * 1000;

logger.info(`[Benchmark Result] Iterations: ${ITERATIONS.toLocaleString()} Duration: ${durationMs.toFixed(2)} ms Ops/sec: ${Math.round(opsPerSec).toLocaleString()}`);
