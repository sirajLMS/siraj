# Shared Parallel Test Runner

The shared test runner consolidates duplicate parallel-test-execution logic across db, services, and integration test suites.

## Why This Pattern Exists

Three separate test runner scripts (`run-db-tests-parallel.ts`, `run-services-tests-parallel.ts`, `run-integration-tests-parallel.ts`) contained near-identical parallel execution logic. This created maintenance burden and inconsistency risk.

## The Pattern

### Structure

```
scripts/test/
  run-parallel-tests.ts    # Shared runner with configurable RunParallelTestsConfig
scripts/
  run-db-tests-parallel.ts          # Configured instance for DB tests
  run-services-tests-parallel.ts    # Configured instance for services tests
  run-integration-tests-parallel.ts # Configured instance for integration tests
```

### Configuration

Each suite-specific runner creates a `RunParallelTestsConfig` and calls the shared runner:

```typescript
import { runParallelTests } from "./test/run-parallel-tests";

const config: RunParallelTestsConfig = {
  testPattern: "backend/db/test/**/*.test.ts",
  maxWorkers: 4,
  timeout: 30000,
  // ...
};

runParallelTests(config);
```

## Rules

- MUST place the shared runner in `scripts/test/`
- MUST use `RunParallelTestsConfig` interface for configuration
- MUST NOT duplicate parallel execution logic across runners
- SHOULD keep suite-specific runners thin (configuration only)

## Related Documents

- `scripts/run-test/AGENTS.md`
- `.ai/plans/duplications/outcome/2.17-test-runner-consolidation-outcome.md`
