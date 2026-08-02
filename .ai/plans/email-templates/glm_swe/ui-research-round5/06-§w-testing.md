# Round 5 Audit: §W — Testing Depth

## Summary
- INVALID specs: 3 (W5 precedent wrong, W10 contradicts own rules, W1↔S6 cross-link broken)
- PARTIAL specs: 4 (W2 precedent flipped, W5 citation, W9 wrong lines, W1 probe missing)
- NEW gaps: 5
- v9 fixes verified correct: 4/4 (W2 dir ✓, W4 TestWrapper ✓, W5 Phase-2 table ✓, W9 TestWrapper RTL/viewport ✓)

## W1 — PARTIAL (broken §S6 cross-link)
- `testClient.ts` exists and is correct ✓
- Per-domain dirs exist ✓
- BUT: §S6 (line 1654) promises "throw-and-log probe in §W1" — §W1 contains NO probe
- Probe approach never specified: no file location, no guidance on whether it's `.test.ts` or script
- Fix: add `backend/db/test/email/drizzle-constraint-probe.test.ts` or inline block in W5 race test

## W2 — PARTIAL (precedent citation inverted)
- v9 fix (mocks dir `test/ui/components/email-templates/mocks/`) correct ✓
- `MockLink.MockedResponse` import valid ✓
- **Precedent citation WRONG**: v9 says real precedent is `SearchScheduleContainer.stories.tsx` — but that file uses raw `MockedProvider` + untyped array
- The actual typed-factory precedent is in `.test.tsx` (line 166-192): `createSearchMock()` returning `MockLink.MockedResponse[]`
- v9's correction flips the right precedent to the wrong one — self-inconsistent with "use TestWrapper, NOT raw MockedProvider"

## W3 — VALID
- `test/ui/components/fixtures/` exists with only `adminDashboardFixtures.ts` ✓
- No email-template fixtures exist ✓
- `entity-setup.ts` has user/parent/teacher/student but no email-template entity ✓

## W4 — VALID (v9 fix correct + valid caveat)
- `TestWrapper` verified: wraps MockLink + ThemeContext + CacheProvider + ThemeProvider + ViewportProvider + ApolloProvider ✓
- `renderHook` precedent = ZERO confirmed ✓ — spec's `<TestComponent>` fallback is correct
- v9 didn't verify `@testing-library/react` exports `renderHook` under Happy DOM setup

## W5 — INVALID (cited precedent doesn't match)
- v9 fix correct: `email_templates` table NOT in schema yet, `runInRollback` can't handle concurrent conflicts ✓
- **BUT precedent citation technically wrong**:
  - `class_quota_race.test.ts` uses `Promise.allSettled` (not `Promise.all`) — `Promise.all` would reject on first failure
  - Repo-internal transactions (not test-level `db.transaction` blocks) — spec says "two `db.transaction` blocks" which is wrong
  - Precedent uses raw `db` for concurrent tests, `runInRollback` only for setup-style
- Fix: change to "two concurrent `publish()` calls inside `Promise.allSettled`; repo methods open own transactions"

## W6 — VALID but narrow
- Covers body `{user.name}` substitution only
- Email subject template has no dedicated test — subject merge-substitution is a gap

## W7 — VALID
- Per-adapter encoding matrix comprehensive ✓

## W8 — VALID (minor overlap)
- Seven error states map onto §P1/P4/P5/P6 ✓
- Minor overlap with W4 not disambiguated (hook-level vs component-DOM-level)

## W9 — PARTIAL (v9 fix correct, line citation wrong)
- v9 fix verified: `TestWrapper` handles RTL + viewport ✓
- **Line citation wrong**: spec cites `TestWrapper.tsx:30,77` — line 30 is `TestWrapperProps` interface, line 77 is `errorPolicy`
- Correct lines: 47 (dir derivation), 88 (`<ThemeProvider>`)

## W10 — INVALID (contradicts own rules + wrong field)
1. Directly contradicts v9's W2/W4: says "Use `MockedProvider`" — W2 says "NOT raw `<MockedProvider>`"
2. `errorMessage` is NOT a `MockLink.MockedResponse` field — real fields are `error?: Error` and/or `result: { errors: [...] }`
- Fix: use `TestWrapper` with `createVersionMismatchMock(vars)` per W2

## W11 — VALID
- Covers `<iframe>`, `<object>`, `data:` URLs ✓
- `isomorphic-dompurify@3.21.0` verified ✓

## v9 Fix Side-Effects
1. W2 precedent flip — redirects from typed `.test.tsx` to untyped `.stories.tsx`
2. W5 correction introduced inaccurate `Promise.all` citation
3. W9 kept stale line citation
4. W10 regression — still uses raw MockedProvider, contradicting v9's own W2/W4

## NEW gaps
1. Subject-template merge-substitution test (body only in W6)
2. `safeRender` degraded-mode test (§S5 specifies it, §W has no test)
3. Preview iframe CSP enforcement test (sandbox='', CSP meta, X-Frame-Options)
4. Snapshot test for React Email compiled HTML output
5. Optimistic-update rollback test scope (W10 covers Save only; Publish and Archive per §Q4)
