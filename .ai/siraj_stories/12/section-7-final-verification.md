## Section 7: Final Verification & Integrity Protocol

Before the sprint is considered officially complete, the following system-wide commands MUST be executed successfully. A single failure means the implementation is rejected.

### 7.1 Static Analysis & Quality Gates
```bash
bun tsgo
bun biome:check
bun lint
bun codescene
```
*Expected Outcome:* 0 errors, 0 warnings across all tools. Type safety must be fully intact, without the use of `any` or forced blind casting.

### 7.2 Core Testing Suite
```bash
bun run test:db
bun run test:graphql
```
*Expected Outcome:* The complete database test suite and GraphQL integration tests must pass cleanly. This includes security regression coverage (ensuring lower roles cannot execute restricted mutations) and data integrity verification.

### 7.3 Frontend Compilation & Generation Check
```bash
bun run generate:gqlSchema
bun codegen
```
*Expected Outcome:* The schema generation script outputs without errors, confirming all Pothos object definitions are valid. Codegen completes successfully, ensuring Apollo types reflect the latest backend changes accurately.

### 7.4 Storybook Coverage
```bash
bun run storybook
```
*Expected Outcome:* Storybook compiles successfully. The newly updated component stories rely on Apollo's `MockedProvider` rendering properly without errors related to old Zustand mock stores.
