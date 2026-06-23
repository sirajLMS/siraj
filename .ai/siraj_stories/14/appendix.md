## Appendix

### A. File Creation Summary

| Category | New Files | Modified Files | Deleted Files |
|---|---|---|---|
| Migration/Enum | 0 | 2 (`enum.ts`, migration SQL) | 0 |
| Repositories | 3 | 1 (`index.ts`) | 0 |
| Services | 5 | 0 | 0 |
| Tests (repo) | 3 | 0 | 0 |
| GraphQL Pothos | 2 | 2 (`index.ts`, `communications.types.ts`) | 0 |
| Frontend Documents | 2 | 1 (`index.ts`) | 0 |
| Type Extraction | 2 | ~22 (component imports) | 0 |
| Tests (GraphQL) | 2 | 0 | 0 |
| Storybook | 0 | 4 (stories) | 0 |
| Stores | 4 | 0 | 0 |
| Views | 0 | 4 (containers) | 0 |
| i18n | 0 | ~7 (types, EN, AR files) | 0 |
| Mock Stores | 0 | 0 | 4 |
| **Total** | **23** | **~43** | **4** |

### B. Dependency Graph

```
Task A (Migration/Permissions)
  └→ Task B (3 Repositories)
       └→ Task C (5 Services: communication + channels + complaint + suggestion)
            └→ Task D (Repo/Service Tests — 100% coverage)
                 └→ Task E (GraphQL Pothos — 2 files)
                      └→ Task F (Frontend Apollo Documents — 2 files)
                           ├→ Task G (Type Extraction from mock stores)
                           │    ├→ Task I (Storybook Migration — 4 stories)
                           │    └→ Task J (Frontend Stores — 4 Zustand stores)
                           │         └→ Task K (Frontend Views — 4 containers + delete 4 mock stores)
                           │              └→ Task L (i18n — ~15 new keys)
                           └→ Task H (GraphQL Tests)
```

### C. Permission Summary

| Permission Key | Enum Value | Group | Type |
|---|---|---|---|
| `complaints.list` | `COMPLAINTS_LIST` | Super Admin, Academy Admin, Staff Default | Existing (reused) |
| `complaints.delete` | `COMPLAINTS_DELETE` | Super Admin, Academy Admin | Existing (reused) |
| `complaints.respond` | `COMPLAINTS_RESPOND` | Super Admin, Academy Admin | Existing (reused) |
| `support.submit_complaint` | `SUPPORT_SUBMIT_COMPLAINT` | Super Admin, Parent Default | New |
| `support.view_history` | `SUPPORT_VIEW_HISTORY` | Super Admin, Parent Default | New |
| `communication.submit_suggestion` | `COMMUNICATION_SUBMIT_SUGGESTION` | Super Admin, Parent Default | New |
| `system.dispatch_email` | `SYSTEM_DISPATCH_EMAIL` | Super Admin, System Automated | New |

### D. Temp File Index

| Temp File | Purpose |
|---|---|
| `temp/M1.md` | Schema analysis — all tables/columns/enums verified |
| `temp/M2.md` | Permission gap analysis — 3 existing + 4 new |
| `temp/M3.md` | Frontend analysis — 42 files, mock stores, migration scope |
| `temp/M4.md` | Backend analysis — zero repos/services/pothos, email stub decision |
| `temp/M5.md` | i18n audit — UI labels complete, ~15 new keys needed |
| `temp/M6.md` | Dependency graph — 12-task build order |
| `temp/M7.md` | User decision log — 12 confirmed decisions |

### E. User-Confirmed Decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Schema changes | No changes needed |
| 2 | Permission strategy | 3 existing + 4 new |
| 3 | Email dispatch | Interface + stub now |
| 4 | On-app channel | Reuse notificationDeliveries |
| 5 | Repository structure | 3 separate files |
| 6 | English i18n | Keep monolithic en.ts |
| 7 | Category labels | Add to existing ComplaintsLabels type |
| 8 | Build order | 12 tasks (A–L) confirmed |

### F. Out of Scope (Deferred)

- Real email sending infrastructure (follow-up story)
- SMS or push notification channels
- Complaint file attachments UI integration
- Suggestion admin "mark reviewed" email dispatch
- Admin suggestion management permissions beyond `complaints.list`
- English split file migration
