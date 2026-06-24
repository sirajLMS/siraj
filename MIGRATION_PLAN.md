# Migration Plan: Enforce Single Canonical Object Type Pattern

## Overview
This plan orchestrates the migration of the codebase to enforce the single canonical object type pattern. Rather than making assumptions about which files follow or violate the pattern, this plan will discover violations dynamically and handle them incrementally.

## Migration Strategy: Table-by-Table Approach

### Phase 1: Discovery and Assessment
For each table in the database schema:
1. Identify all existing type definitions across all layers (repositories, services, GraphQL, etc.)
2. Locate where types are currently defined (may be in other .types files or scattered across layers)
3. Assess current violations of the single canonical object type pattern

### Phase 2: Per-Table Migration Process
For each identified table/domain:
1. Create or update the canonical `{Entity}.types.ts` file with proper types
2. Consolidate scattered types into the canonical file
3. Move unrelated types from the canonical file to their own respective files
4. Update all dependent files to use the canonical types
5. **CRITICAL STOP POINT**: Pause and wait for user approval before proceeding to the next table

### Phase 3: Layer Updates
After user approves canonical type changes:
1. Update repository layer to use canonical types
2. Update service layer to use canonical types
3. Update GraphQL layer to use canonical types
4. Update test layer to use canonical types
5. **CRITICAL STOP POINT**: Pause and wait for user approval before proceeding to the next table

## Detailed Migration Steps per Table

### Step 1: Identify Target Table
- Parse `backend/db/schema/*.ts` to identify all tables
- Select the next table to migrate

### Step 2: Locate Current Type Definitions
- Search for all type definitions related to the table across:
  - `backend/types/*.types.ts` (find where types currently exist)
  - `backend/db/repo/*.ts` (repository return/input types)
  - `backend/services/*.ts` (service types)
  - `backend/graphql/pothos/*.ts` (Pothos local type definitions)
  - `frontend/graphql/sharedDocuments/*.ts` (frontend types)

### Step 3: Create Canonical Type Definition
- In `backend/types/{entity}.types.ts`:
  - Define `{Entity}SelectType = typeof {entityTable}.$inferSelect`
  - Define `{Entity}InsertType = typeof {entityTable}.$inferInsert`
  - Define `{Entity}ReturnType` with proper omissions and additions
  - Define `{Entity}SubmitInput`, `{Entity}UpdateInput`, other input types as needed

### Step 4: Consolidate Scattered Types
- Move all entity-related types from other locations to the canonical file
- If unrelated types exist in the target file, move them to their respective canonical files
- Ensure all type definitions follow the naming convention and pattern

### Step 5: Pause for Approval
- Present the consolidated canonical type file to the user
- Wait for explicit approval before proceeding
- **NO AUTOMATIC PROCEEDING** - must wait for user instruction

### Step 6: Update All Layers (Post Approval)
- Update repository files to import and use canonical types
- Update service files to import and use canonical types
- Update GraphQL Pothos files to use canonical types instead of local definitions
- Update test files to import and use canonical types
- Update frontend GraphQL files to use generated types that align with backend canonical types

### Step 7: Pause Again for Approval
- Present all updated files to the user
- Wait for explicit approval before proceeding to next table
- **NO AUTOMATIC PROCEEDING** - must wait for user instruction

## Critical Rules

### Rule 1: Mandatory Stop Points
- After creating/updating canonical type files → STOP and WAIT
- After updating all dependent files → STOP and WAIT
- Never proceed without explicit user approval

### Rule 2: One File Per Table
- Each table gets exactly one canonical `.types.ts` file
- Related types stay in the same file
- Unrelated types are moved to their respective canonical files

### Rule 3: No Assumptions
- Do not assume any file follows the pattern
- Discover current state dynamically
- Handle each table independently

### Rule 4: Type Consolidation
- All entity-related types must be in the canonical file
- Remove duplicate or local type definitions from other layers
- Replace local type definitions with imports from canonical types

## Implementation Orchestra

### Discovery Process:
1. List all tables from `backend/db/schema/*.ts`
2. For each table, search and catalog all existing type definitions
3. Identify violations and scattered types
4. Generate specific migration tasks per table

### Execution Process:
1. Process tables one at a time
2. For each table:
   - Consolidate types into canonical file
   - STOP for approval
   - Update dependent layers
   - STOP for approval
   - Proceed to next table only after approval

### Validation Process:
- After each approval checkpoint, verify:
  - Canonical types file contains only the correct types for the entity
  - No local type definitions remain in other layers
  - All imports point to the canonical types
  - All functionality remains intact

## Error Handling
- If user does not approve changes, halt the entire migration process
- If type consolidation breaks functionality, provide rollback option
- If dependencies are too complex to update, flag for manual review

## Success Criteria
- Each table has exactly one canonical `.types.ts` file
- All other layers import and use canonical types
- No local type definitions exist in Pothos or other layers
- All functionality remains intact
- Each change is approved by the user before proceeding