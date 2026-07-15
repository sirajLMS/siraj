---
name: "02: Fix missing error properties used in backend services"
overview: "Add missing error properties to ErrorsLabels that are used in backend services/repos"
todos:
  - id: "1"
    content: Audit backend files for ErrorsLabels usage
    status: "pending"
  - id: "2"
    content: Add missing error properties to ErrorsLabels type
    status: "pending"
  - id: "3"
    content: Add translations to en/ar error files
    status: "pending"
isProject: false
---

# Plan 02: Fix Missing Error Properties in Backend

## Files to Check
Search backend for `ctx.t("errors")` or `getServerTranslations(..., "errors")` usage and verify all accessed properties exist in ErrorsLabels type.

## Backend Files Likely Using Errors
- `backend/services/**/*.ts`
- `backend/db/repo/**/*.ts`
- `backend/graphql/**/*.ts`

## Process
1. Search for all error property accesses in backend
2. Compare with ErrorsLabels interface
3. Add missing properties with appropriate types (string or function for interpolation)
4. Add translations to locale files
