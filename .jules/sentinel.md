## 2026-08-22 - Demo Login Group Restrictions Break GraphQL Test Suite

**Vulnerability:** Attempted to exclude `super_admin` from `DemoAuthService.loginWithGroupSlug` to harden demo logins.
**Learning:** The GraphQL integration test suite relies on `loginDemoUser("super_admin")` in `test/helpers/graphql-test-helpers.ts` to execute privileged test operations when `IS_DEMO=true`. Excluding `super_admin` breaks `bun run test:graphql`.
**Prevention:** Do not restrict `super_admin` from demo logins without updating test helpers or providing an alternative auth test mechanism.
