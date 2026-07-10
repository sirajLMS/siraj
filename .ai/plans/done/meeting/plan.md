# Meeting Configs — Plan

See [spec.md](./spec.md). Mirrors [payment plan](../payment/plan.md) with `meeting_providers` catalog instead of payment type enums.

## Phase pipeline

| Phase | Work | Gate |
|-------|------|------|
| 1 | Types + Zod + frontend/lib | tsgo |
| 2 | Schema + cleanGenerate + seeds | db tests |
| 3 | Repositories | test:db |
| 4 | Services | service tests |
| 5 | Pothos + codegen | test:graphql |
| 6 | Frontend documents | codegen |
| 7 | UI + admin catalog | Storybook |
| 8 | View migrations | manual |
| 9 | quality-gate | full gate |
