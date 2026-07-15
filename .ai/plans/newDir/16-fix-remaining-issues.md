---
name: "16: Fix remaining tsgo errors and verify"
overview: "Fix any remaining TypeScript errors and run tsgo to verify all fixed"
todos:
  - id: "1"
    content: Fix complaints dashboard - ComplaintsLabels missing parent/admin, type mismatches
    status: "pending"
  - id: "2"
    content: Fix suggestions dashboard - namespace and missing properties
    status: "pending"
  - id: "3"
    content: Fix supervisor portal - missing properties
    status: "pending"
  - id: "4"
    content: Fix teacher portal - missing properties
    status: "pending"
  - id: "5"
    content: Fix resources dashboard - missing properties
    status: "pending"
  - id: "6"
    content: Fix LMS dashboard - missing properties
    status: "pending"
  - id: "7"
    content: Fix subjects dashboard - missing properties
    status: "pending"
  - id: "8"
    content: Run tsgo to verify all errors fixed
    status: "pending"
  - id: "9"
    content: Run biome:check to verify formatting
    status: "pending"
  - id: "10"
    content: Run lint via queue to verify no lint errors
    status: "pending"
isProject: false
---

# Plan 16: Fix Remaining Issues and Verify

## Files to Modify (various)
Remaining dashboard components with translation issues.

## Key Issues
1. Missing properties in label type definitions across various dashboard domains
2. Translation namespace mismatches
3. Labels objects used as callables

## Verification Steps
1. Run `bun tsgo` - should pass with 0 errors
2. Run `bun biome:check` - should pass
3. Run lint via queue - should pass
