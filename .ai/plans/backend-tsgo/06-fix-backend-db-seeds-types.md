---
name: "06: Fix backend database seed type issues"
overview: "Fix TypeScript errors in database seeds"
todos:
  - id: "1"
    content: Fix billing seed supported mobile wallets
    status: "pending"
  - id: "2"
    content: Fix billing seed supported online accounts
    status: "pending"
  - id: "3"
    content: Fix billing seed supported payment links
    status: "pending"
  - id: "4"
    content: Fix meeting seed class meeting configs
    status: "pending"
  - id: "5"
    content: Fix meeting seed meeting providers
    status: "pending"
  - id: "6"
    content: Fix meeting seed user meeting configs
    status: "pending"
isProject: false
---

# Plan 06: Fix Backend Database Seed Type Issues

## Files to Modify (from git status)
- `backend/db/seeds/billing/seed-supported-mobile-wallets.ts`
- `backend/db/seeds/billing/seed-supported-online-accounts.ts`
- `backend/db/seeds/billing/seed-supported-payment-links.ts`
- `backend/db/seeds/meeting/seed-class-meeting-configs.ts`
- `backend/db/seeds/meeting/seed-meeting-providers.ts`
- `backend/db/seeds/meeting/seed-user-meeting-configs.ts`

## Common Issues
1. Drizzle insert type mismatches
2. Missing required fields
3. Type inference issues
