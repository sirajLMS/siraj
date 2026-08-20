---
name: test-expert
description: >
  Comprehensive test engineering expert. Use when tasked to:
  (1) write tests to maximize coverage (100% line & branch coverage),
  (2) discover and test edge cases, boundaries, and off-by-one errors,
  (3) generate monkey tests, chaos tests, and randomized fuzz payloads,
  (4) write security and abuse tests (injection, IDOR, auth bypass, role escalation).
---

# Test Expert Guide: 4-Tier Testing & Multi-Layer Constraints

This skill provides an advanced test engineering methodology for writing bulletproof tests across database repositories, backend services, and GraphQL operations in the Siraj codebase.

---

## 1. Architectural Layer Routing & Hard Constraints

Before writing any test, identify the target layer and enforce its non-negotiable rules:

```
Target Layer Selection:
 ├── [1. Database Layer] (`backend/db/test/`)
 │    ├── Path: `repo/` (100% method coverage) or `logic/` (business constraints, RLS)
 │    ├── Runner: `bun run test/scripts/run-test.ts <path>` (or `bun run test:db`)
 │    └── Strict Rules:
 │         • ALWAYS wrap with `runInRollback(async (tx) => { ... })` from `@/backend/db/test/test-utils`
 │         • ALWAYS pass `tx` to EVERY repository method and direct Drizzle query
 │         • NEVER use `expect(...).rejects.toThrow()` inside `runInRollback` (causes transaction deadlocks) — use `expectRepoError()` try/catch helper
 │         • NEVER query seed data — dynamically provision with `backend/db/test/entity-setup.ts` helpers inside `tx`
 │         • Assert on localized message substrings (`.toContain("not found")`), never raw keys
 │
 ├── [2. Backend Services Layer] (`backend/services/`)
 │    ├── Path: Co-located `*.service.test.ts` or `backend/services/**/test/`
 │    ├── Runner: `bun run test:services` (or `bun run test/scripts/run-test.ts <path>`)
 │    └── Strict Rules:
 │         • STRICT BAN on real external network calls — mock all outbound adapters
 │         • Mock notifications: `spyOn(CommunicationService, "dispatchMulti")` / `dispatchWithPreferences`
 │         • Mock channels: email, SMS, push, WhatsApp (`WhatsappChannelFactory`)
 │         • Mock FX / rates: `FixerLatestResponse` / FX adapters
 │         • Mock cache: `cacheService` / `ICacheService` (never hit real Upstash Redis)
 │         • Live provider smokes belong ONLY in `test/integration/` (`bun run test:integration`)
 │
 └── [3. GraphQL Integration Layer] (`frontend/common/graphql/test/`)
      ├── Path: `frontend/common/graphql/test/<domain>/<scenario>.test.ts`
      ├── Runner: `bun run test:graphql` (via `test/scripts/run-server-tests.ts`)
      └── Strict Rules:
           • ALWAYS call `setupTestServerLifecycle()` at root of describe block
           • ALWAYS execute via `testClient` and `TypedDocumentNode` from `sharedDocuments/<domain>/`
           • STRICT INTERFACE ISOLATION: Never import `db/repo` or backend services directly in GraphQL tests
           • 100% MUTATION ARGUMENT COVERAGE: Pass ALL required and optional arguments (test optional with non-null AND `null` values)
           • Always use generated enums from `@/frontend/common/graphql/generated/gql/graphql-types`
```

---

## 2. The 4-Tier Test Generation Framework

Every tested unit, repository, service, or GraphQL resolver must be tested across four distinct tiers:

```
[Tier 1: Happy Path & 100% Branch Coverage]
  └─ Target: 100% branch, statement, and error-throw coverage for standard flows
[Tier 2: Edge Cases & Boundary Value Analysis]
  └─ Target: Min/max bounds, nullability, timezones, empty sets, off-by-one
[Tier 3: Monkey & Chaos Testing]
  └─ Target: Fuzz inputs, randomized data, concurrency races, rapid replays
[Tier 4: Security & Abuse Testing]
  └─ Target: Injection, IDOR, role tampering, tenant isolation, auth bypass
```

---

## Tier 1: Happy Path & 100% Branch Coverage

Ensure every branch, fallback (`??`), optional chain, and error throw in the code under test is explicitly exercised.

- Test every `if/else`, `switch/case`, optional chain fallback (`??`), and early return.
- Repository methods under `backend/db/test/repo/` **MUST** achieve 100% line and function coverage.
- Verify coverage via:
  ```bash
  bun run test/scripts/run-test.ts <path-to-test>
  bun run test:db:coverage
  ```

---

## Tier 2: Edge Cases & Boundary Value Analysis

Systematically test all input boundaries and degenerate cases:

### Boundary Vectors Checklist
| Domain | Edge Case Test Scenarios |
| :--- | :--- |
| **Strings** | Empty string `""`, whitespace-only `"   "`, ultra-long (10k chars), multi-byte UTF-8, Arabic RTL text, emoji (`🎉`), SQL special chars (`'`, `"`, `--`, `;`, `\`), HTML/script tags (`<script>`). |
| **Numbers & Limits** | `0`, `-1`, negative values, `Number.MAX_SAFE_INTEGER`, decimal fractions when integer expected, boundary limits (e.g. page size 0, 1, 100, 101). |
| **Arrays & Sets** | Empty array `[]`, single item `[x]`, large batch (1000 items), duplicate items `[id, id]`, array with `null`/`undefined` elements. |
| **Dates & Timezones** | Leap years (Feb 29), Year boundary (Dec 31 23:59:59 → Jan 1 00:00:00), Daylight Saving Time shifts (spring forward / fall back), differing IANA timezones (`UTC`, `Africa/Cairo`, `America/New_York`, `Asia/Tokyo`), past dates vs future dates. |
| **Pagination & Sorting** | `limit: 0`, `page: 0`, `page: 999999` (empty page), negative offsets, sorting on nullable columns with `NULLS FIRST` / `NULLS LAST`. |
| **Version & Concurrency** | Stale `expectedVersion` (optimistic locking failure), rapid concurrent updates on the same record. |

---

## Tier 3: Monkey & Chaos Testing

Test unpredictable, chaotic, and non-deterministic execution environments.

### 1. Randomized Fuzz Payloads
Use generative property testing and randomized strings to verify resilience:
```typescript
function generateFuzzPayload(length: number): string {
  const chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~ \t\n\r\u0000\uFFFF\uD83D\uDE00";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
```

### 2. Concurrency Race Testing
Trigger multiple concurrent requests against the same resource to verify atomic locks, idempotency keys, and transaction isolation:
```typescript
test("handles concurrent balance deductions without race conditions", async () => {
  await runInRollback(async (tx) => {
    // Simulate 10 simultaneous debit operations inside rollback
    const results = await Promise.allSettled(
      Array.from({ length: 10 }).map(() =>
        TargetService.deductResource(targetEntityId, 1, tx)
      )
    );

    const successful = results.filter(r => r.status === "fulfilled");
    expect(successful.length).toBeLessThanOrEqual(initialQuota);
  });
});
```

### 3. Out-of-Order & Replay Actions
- Triggering webhook duplicate events (idempotency key validation).
- Transitioning state machines illegally (e.g. `COMPLETED` → `PENDING` or `CANCELLED` → `ACTIVE`).

---

## Tier 4: Security & Abuse Testing

Write explicit tests that act like an attacker to confirm defenses hold:

### 1. SQL & LIKE Injection Tests
Test repository and search methods with malicious search terms:
```typescript
test("escapes SQL wildcards and quotes in search methods", async () => {
  await runInRollback(async (tx) => {
    const maliciousSearches = [
      "%",
      "_",
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "test\\%_wildcard",
    ];

    for (const search of maliciousSearches) {
      const results = await TargetRepository.search(search, tx);
      expect(Array.isArray(results)).toBe(true);
    }
  });
});
```

### 2. Broken Object Level Authorization (BOLA / IDOR)
Refer to [idor-testing](file:///home/ahmed/Projects/siraj/.agents/skills/idor-testing/SKILL.md) for full dual-account testing harness patterns.

### 3. Privilege Escalation & Role Tampering
Verify that low-privilege tokens cannot execute administrative mutations or operations.

---

## Verification Commands

```bash
# Run specific test with log capture
bun run test/scripts/run-test.ts <path-to-test-file>

# Run layer suites
bun run test:db             # DB tests (parallel)
bun run test:services       # Service tests
bun run test:graphql        # GraphQL integration tests

# Verify code quality on newly created test files
bun tsgo
bun oxlint
bun biome:check
bun run scripts/lint-service.ts -f <path-to-test-file>
```
