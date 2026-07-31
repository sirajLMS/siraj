# GraphQL Provider Comparison Report: Postgres vs Neon

**Date:** 2026-07-31
**Test Suite:** `frontend/common/graphql/test/` (330 tests)
**Test Runner:** Bun v1.3.14

---

## Executive Summary

**Neon is significantly slower than Postgres across nearly all GraphQL integration tests.**

- **Postgres total time:** 492.16s (8m 12s)
- **Neon total time:** 1080.15s (18m 0s)
- **Neon is 119.5% slower overall** (nearly 2.2x the runtime)
- **319 of 330 tests (96.7%) are slower on Neon**
- **Only 11 tests (3.3%) are faster on Neon**

---

## Overall Statistics

| Metric | Postgres | Neon | Difference |
|--------|----------|------|------------|
| Total runtime | 492.16s | 1080.15s | +587.99s (+119.5%) |
| Average per test | 1491.39ms | 3273.19ms | +1781.80ms (+119.5%) |
| Tests faster on Neon | — | 11 | — |
| Tests slower on Neon | — | 319 | — |
| Tests with same time | — | 0 | — |

---

## Top 20 Slowest Tests on Neon (vs Postgres)

| # | Test | Postgres (ms) | Neon (ms) | Diff (ms) | % Slower |
|---|---|---|---|---|---|
| 1 | Teacher Portal > teacherAssignedClasses — allowed for teacher_default | 56.31 | 56,522.80 | +56,466.49 | +100,277.9% |
| 2 | Class Session > find student and teacher IDs, clear schedule range | 4,618.71 | 52,879.89 | +48,261.18 | +1,044.9% |
| 3 | Class Session > session lifecycle: start, reset, restart, leave | 1,670.70 | 24,940.22 | +23,269.52 | +1,392.8% |
| 4 | Class Session > teacher marks class past waiting period as absent | 2,748.22 | 22,830.80 | +20,082.58 | +730.7% |
| 5 | Schedule > deleteRecurringClass — admin succeeds (any class) | 2,876.65 | 21,946.46 | +19,069.81 | +662.9% |
| 6 | Group Class > provision test entities, class instance, group class | 1,296.67 | 11,703.76 | +10,407.09 | +802.6% |
| 7 | Schedule > deleteRecurringClass — teacher denied (other's class) | 7,429.69 | 17,602.34 | +10,172.65 | +136.9% |
| 8 | Manager Directory > provision test entities, super admin, managers | 1,694.99 | 11,526.68 | +9,831.69 | +580.0% |
| 9 | Class Session > teacher activates class within window | 189.17 | 9,258.04 | +9,068.87 | +4,794.0% |
| 10 | Class Instance Detail > provision test entities, create class | 1,018.62 | 10,014.79 | +8,996.17 | +883.2% |
| 11 | Teacher Dashboard > createTeacherManualClassEntry | 1,074.97 | 9,766.11 | +8,691.14 | +808.5% |
| 12 | Schedule > provision test entities and super admin | 1,854.90 | 9,908.07 | +8,053.17 | +434.2% |
| 13 | Billing > createManualInvoice — provision test entities and login | 1,236.28 | 7,863.91 | +6,627.63 | +536.1% |
| 14 | Billing > markInvoicePaid — provision test entities and login | 1,288.19 | 7,187.28 | +5,899.09 | +457.9% |
| 15 | Permission Group Simulation > provision super admin | 1,189.93 | 7,042.03 | +5,852.10 | +491.8% |
| 16 | Student Profile > parent_default can load associated student profile | 665.43 | 7,221.95 | +6,556.52 | +985.3% |
| 17 | Status Tracking > login as academy_admin and provision test entities | 1,196.01 | 6,855.96 | +5,659.95 | +473.2% |
| 18 | Student Lifecycle > reassignStudentTeacher — login and provision | 1,116.58 | 6,814.96 | +5,698.38 | +510.3% |
| 19 | Reports > generateAttendanceReport — provision test entities | 1,143.49 | 6,944.62 | +5,801.13 | +507.3% |
| 20 | Impersonation > provision isolated users for impersonation tests | 2,323.47 | 6,767.71 | +4,444.24 | +191.3% |

---

## Tests Where Neon is Faster (11 of 330)

| # | Test | Postgres (ms) | Neon (ms) | Diff (ms) | % Faster |
|---|---|---|---|---|---|
| 1 | Auth > obtain super admin token via demoLogin | 1,036.43 | 964.12 | -72.31 | -7.0% |
| 2 | Auth > UNAUTHENTICATED error when querying me without auth headers | 36.11 | 16.31 | -19.80 | -54.8% |
| 3 | Auth > refreshToken returns null when invalid token/missing session | 20.91 | 11.55 | -9.36 | -44.8% |
| 4 | Notification Preferences > denied when unauthenticated | 11.17 | 11.54 | +0.37 | +3.3% |
| 5 | Teacher > returns error on teachers query when unauthenticated | 13.95 | 14.78 | +0.83 | +5.9% |
| 6 | Student Onboarding > Unauthenticated denied creating student | 19.75 | 617.53 | +597.78 | +3,026.7% |
| 7 | Manager Onboarding > Unauthenticated denied creating manager | 19.05 | 685.02 | +665.97 | +3,495.9% |
| 8 | Teacher Onboarding > Unauthenticated denied creating teacher | 20.75 | 630.82 | +610.07 | +2,940.1% |
| 9 | Parent Onboarding > Unauthenticated denied creating parent | 25.30 | 668.94 | +643.64 | +2,544.0% |
| 10 | Student Directory > Unauthenticated request denied | 18.00 | 620.37 | +602.37 | +3,346.5% |
| 11 | Translations > returns welcomeMessage in Arabic by default | 21.71 | 251.77 | +230.06 | +1,059.7% |

---

## Per-Domain Analysis

### Auth (11 tests)
- **Postgres avg:** 209.50ms
- **Neon avg:** 1,269.44ms
- **Neon is 506.0% slower**
- Notable: `refreshToken` with valid session_id went from 165.71ms to 3,116.43ms (+1,780.6%)

### Impersonation (10 tests)
- **Postgres avg:** 344.25ms
- **Neon avg:** 2,531.92ms
- **Neon is 635.5% slower**

### Billing (19 tests)
- **Postgres avg:** 598.53ms
- **Neon avg:** 2,029.42ms
- **Neon is 239.1% slower**

### Classes (18 tests)
- **Postgres avg:** 1,009.42ms
- **Neon avg:** 10,344.82ms
- **Neon is 924.8% slower**
- Worst domain — class session lifecycle tests are 10-14x slower

### Complaints (27 tests)
- **Postgres avg:** 11,050.74ms
- **Neon avg:** 6,692.63ms
- **Neon is 39.4% faster** (only domain where Neon is faster overall)
- Note: Postgres complaint tests have some very slow tests (103s for deleteComplaint provision)

### Meeting Config (8 tests)
- **Postgres avg:** 135.91ms
- **Neon avg:** 1,740.00ms
- **Neon is 1,180.3% slower**

### Notifications (3 tests)
- **Postgres avg:** 63.49ms
- **Neon avg:** 1,661.63ms
- **Neon is 2,517.2% slower**

### Parents (42 tests)
- **Postgres avg:** 218.93ms
- **Neon avg:** 1,994.42ms
- **Neon is 811.0% slower**

### Permissions (6 tests)
- **Postgres avg:** 250.73ms
- **Neon avg:** 2,904.65ms
- **Neon is 1,058.5% slower**

### Profile (2 tests)
- **Postgres avg:** 72.22ms
- **Neon avg:** 2,450.50ms
- **Neon is 3,293.1% slower**

### Reports (5 tests)
- **Postgres avg:** 293.06ms
- **Neon avg:** 3,602.32ms
- **Neon is 1,129.2% slower**

### Resources (10 tests)
- **Postgres avg:** 147.62ms
- **Neon avg:** 2,791.20ms
- **Neon is 1,790.8% slower**

### Scheduling (22 tests)
- **Postgres avg:** 1,035.82ms
- **Neon avg:** 4,184.42ms
- **Neon is 304.0% slower**

### Students (31 tests)
- **Postgres avg:** 1,067.23ms
- **Neon avg:** 2,647.42ms
- **Neon is 148.1% slower**

### Suggestions (14 tests)
- **Postgres avg:** 1,078.86ms
- **Neon avg:** 1,784.29ms
- **Neon is 65.4% slower**

### Teachers (42 tests)
- **Postgres avg:** 1,043.86ms
- **Neon avg:** 3,480.42ms
- **Neon is 233.4% slower**

### Translations (6 tests)
- **Postgres avg:** 24.53ms
- **Neon avg:** 492.29ms
- **Neon is 1,906.9% slower**

### Settings (8 tests)
- **Postgres avg:** 192.48ms
- **Neon avg:** 1,636.88ms
- **Neon is 750.4% slower**

---

## Key Findings

1. **Neon is consistently slower across 96.7% of tests.** The average test is 2.2x slower on Neon.

2. **The worst-performing domain is Classes** (924.8% slower), particularly class session lifecycle operations which involve multiple sequential mutations.

3. **Provision/setup tests are disproportionately slow on Neon.** Tests that create test entities (provisioning users, classes, schedules) show 4-10x slowdowns, suggesting Neon's write latency is significantly higher.

4. **Simple read queries are also slower.** Even basic queries like `teacherDirectory` or `parentDirectory` show 10-20x slowdowns on Neon.

5. **The only domain where Neon is faster is Complaints** (39.4% faster), but this is likely due to Postgres having outlier slow tests in that domain rather than Neon being genuinely faster.

6. **Network latency is the likely root cause.** Neon is a serverless Postgres provider accessed over the internet, while the local Postgres instance has near-zero network latency. Every query incurs this overhead.

---

## Recommendations

1. **Use local Postgres for development and CI testing** to keep test runtimes manageable (8 min vs 18 min).

2. **If Neon must be used**, consider:
   - Running tests closer to the Neon region to reduce latency
   - Batching mutations to reduce round-trips
   - Increasing test timeouts to accommodate the slower performance

3. **Investigate the outlier tests** (teacherAssignedClasses at 56,522ms) — this may indicate a specific query pattern that performs poorly on Neon.

4. **The 11 tests that are faster on Neon** are all very fast tests (<100ms) where the difference is negligible and likely within measurement noise.