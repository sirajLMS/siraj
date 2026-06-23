### Task L — Frontend Stores: Create Real Onboarding Zustand Stores

**Objective:** Create real Zustand stores for onboarding state management that use Apollo `useMutation` hooks with generated `TypedDocumentNode`s, replacing mock stores in production containers.

**Dependencies:** Task K — i18n translations are verified. Depends on generated GraphQL types, Apollo documents from Task G, and types from Task H.

**Layer-Specific Rules (Frontend Stores - Flattened from frontend/stores/AGENTS.md):**
- Zustand for global state management.
- Strict Typing: Stores should be strictly typed using the GraphQL generated types.
- Direct Assignment: Solve TypeScript errors by adjusting the GraphQL schema or queries. Do NOT create complex intermediate mapping functions.
- **No mock data in production** — Mock stores only in `*.stories.tsx` files.

**Target Files:**
- `frontend/stores/teacherOnboardingStore.ts` — New file
- `frontend/stores/parentOnboardingStore.ts` — New file
- `frontend/stores/managerOnboardingStore.ts` — New file

**Detailed Implementation Steps:**

*Step 1: Create Teacher Onboarding Store*

Create `frontend/stores/teacherOnboardingStore.ts`:

```typescript
import { useMutation } from "@apollo/client/react";
import { create } from "zustand";
import { createTeacherMutationDocument } from "@/frontend/graphql/sharedDocuments/teacher-onboarding.documents";
import type { TeacherOnboardingFormData } from "@/frontend/views/dashboard/teachers/onboarding/types";
import { mapTeacherFormDataToInput } from "@/frontend/views/dashboard/teachers/onboarding/types";
import type { TeacherOnboardingResult } from "@/frontend/graphql/generated/gql/graphql-types";

interface TeacherOnboardingState {
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly result: TeacherOnboardingResult | null;
  readonly reset: () => void;
}

export const useTeacherOnboardingStore = create<TeacherOnboardingState>(set => ({
  isSubmitting: false,
  error: null,
  result: null,
  reset: () => set({ isSubmitting: false, error: null, result: null }),
}));

export function useCreateTeacherMutation() {
  const [mutate, { loading, error, data }] = useMutation(createTeacherMutationDocument);
  const store = useTeacherOnboardingStore();

  const execute = async (formData: TeacherOnboardingFormData) => {
    store.reset();
    set({ isSubmitting: true });

    try {
      const input = mapTeacherFormDataToInput(formData);
      const result = await mutate({ variables: { input } });
      
      if (result.data?.createTeacher) {
        set({ result: result.data.createTeacher, isSubmitting: false });
        return result.data.createTeacher;
      }
      
      throw new Error("Mutation returned no data");
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Unknown error",
        isSubmitting: false,
      });
      throw err;
    }
  };

  return { execute, loading, error, data };
}
```

*Step 2: Create Parent Onboarding Store*

Create `frontend/stores/parentOnboardingStore.ts`:

```typescript
import { useMutation } from "@apollo/client/react";
import { create } from "zustand";
import { createParentMutationDocument } from "@/frontend/graphql/sharedDocuments/parent-onboarding.documents";
import type { ParentOnboardingFormData } from "@/frontend/views/dashboard/parents/onboarding/types";
import { mapParentFormDataToInput } from "@/frontend/views/dashboard/parents/onboarding/types";
import type { ParentOnboardingResult } from "@/frontend/graphql/generated/gql/graphql-types";

interface ParentOnboardingState {
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly result: ParentOnboardingResult | null;
  readonly reset: () => void;
}

export const useParentOnboardingStore = create<ParentOnboardingState>(set => ({
  isSubmitting: false,
  error: null,
  result: null,
  reset: () => set({ isSubmitting: false, error: null, result: null }),
}));

export function useCreateParentMutation() {
  const [mutate, { loading, error, data }] = useMutation(createParentMutationDocument);
  const store = useParentOnboardingStore();

  const execute = async (formData: ParentOnboardingFormData) => {
    store.reset();
    set({ isSubmitting: true });

    try {
      const input = mapParentFormDataToInput(formData);
      const result = await mutate({ variables: { input } });
      
      if (result.data?.createParent) {
        set({ result: result.data.createParent, isSubmitting: false });
        return result.data.createParent;
      }
      
      throw new Error("Mutation returned no data");
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Unknown error",
        isSubmitting: false,
      });
      throw err;
    }
  };

  return { execute, loading, error, data };
}
```

*Step 3: Create Manager Onboarding Store*

Create `frontend/stores/managerOnboardingStore.ts`:

```typescript
import { useMutation } from "@apollo/client/react";
import { create } from "zustand";
import { createManagerMutationDocument } from "@/frontend/graphql/sharedDocuments/manager-onboarding.documents";
import type { ManagerOnboardingFormData } from "@/frontend/views/dashboard/managers/onboarding/types";
import { mapManagerFormDataToInput } from "@/frontend/views/dashboard/managers/onboarding/types";
import type { ManagerOnboardingResult } from "@/frontend/graphql/generated/gql/graphql-types";

interface ManagerOnboardingState {
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly result: ManagerOnboardingResult | null;
  readonly reset: () => void;
}

export const useManagerOnboardingStore = create<ManagerOnboardingState>(set => ({
  isSubmitting: false,
  error: null,
  result: null,
  reset: () => set({ isSubmitting: false, error: null, result: null }),
}));

export function useCreateManagerMutation() {
  const [mutate, { loading, error, data }] = useMutation(createManagerMutationDocument);
  const store = useManagerOnboardingStore();

  const execute = async (formData: ManagerOnboardingFormData) => {
    store.reset();
    set({ isSubmitting: true });

    try {
      const input = mapManagerFormDataToInput(formData);
      const result = await mutate({ variables: { input } });
      
      if (result.data?.createManager) {
        set({ result: result.data.createManager, isSubmitting: false });
        return result.data.createManager;
      }
      
      throw new Error("Mutation returned no data");
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Unknown error",
        isSubmitting: false,
      });
      throw err;
    }
  };

  return { execute, loading, error, data };
}
```

*Step 4: Verify TypeScript compilation*

```bash
bun tsgo
```

All stores must compile with zero errors.

**Test Execution Requirements:**
- Verify TypeScript compilation:
  ```bash
  bun tsgo
  ```
- Verify linting:
  ```bash
  bun lint
  ```

**Success Criteria / Check Progress Points:**
- [ ] Teacher onboarding store uses `useMutation` with `TypedDocumentNode`
- [ ] Parent onboarding store uses `useMutation` with `TypedDocumentNode`
- [ ] Manager onboarding store uses `useMutation` with `TypedDocumentNode`
- [ ] All stores use generated GraphQL types (no intermediate mappings)
- [ ] All stores use mapping functions from `types.ts` to transform form data
- [ ] No mock data in production stores
- [ ] Stores manage UI state (isSubmitting, error, result)
- [ ] `bun tsgo` passes with zero TypeScript errors
- [ ] `bun lint` passes with zero errors

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
