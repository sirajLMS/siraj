### Task J — Storybook Migration: MockedProvider for Onboarding Containers

**Objective:** Migrate all three onboarding container stories to use Apollo's `MockedProvider` with mock GraphQL responses instead of relying on Zustand mock stores.

**Dependencies:** Task H — types are extracted and available. Depends on generated GraphQL types and existing story infrastructure.

**Layer-Specific Rules (Storybook Migration - Flattened from AGENTS_STORY_PLANNING.md):**
- When containers migrate from mock stores to `useMutation`, their `*.stories.tsx` files MUST be updated to use `MockedProvider` from `@apollo/client/testing`.
- Define mock GraphQL responses as constants within the story file using `__typename` and generated type shapes.
- Keep the container as the top-level story component.
- Mock permission gates (e.g., `<RequirePermission>`) via decorators or store state overrides.
- Provide multiple story variants (Default, Empty, Loading) where applicable.
- Mock stores preserved for Storybook — `*.stories.tsx` files MUST keep dummy data available, but the delivery mechanism changes from Zustand store imports to `MockedProvider` mock responses.

**Target Files:**
- `frontend/views/dashboard/teachers/onboarding/TeacherOnboardingContainer.stories.tsx` — Update to use MockedProvider
- `frontend/views/dashboard/parents/onboarding/ParentOnboardingContainer.stories.tsx` — Update to use MockedProvider
- `frontend/views/dashboard/managers/onboarding/ManagerOnboardingContainer.stories.tsx` — Update to use MockedProvider

**Detailed Implementation Steps:**

*Step 1: Update Teacher Onboarding Story*

Replace `frontend/views/dashboard/teachers/onboarding/TeacherOnboardingContainer.stories.tsx`:

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { MockedProvider } from "@apollo/client/testing";
import { TeacherOnboardingContainer } from "./TeacherOnboardingContainer";
import { createTeacherMutationDocument } from "@/frontend/graphql/sharedDocuments/teacher-onboarding.documents";
import { useUserStore } from "@/frontend/stores/userStore";
import { AppPermission } from "@/shared/lib/enum";

const mockTeacherResult = {
  data: {
    createTeacher: {
      __typename: "TeacherOnboardingResult",
      userId: "test-user-id-123",
      teacherId: "test-teacher-id-456",
      name: "Test Teacher",
      email: "test@teacher.com",
      status: "ACTIVATED",
    },
  },
};

const mockTeacherError = {
  errors: [
    {
      message: "An account with this email address already exists.",
      path: ["createTeacher"],
    },
  ],
};

const meta: Meta<typeof TeacherOnboardingContainer> = {
  title: "Views/dashboard/teachers/onboarding/TeacherOnboardingContainer",
  component: TeacherOnboardingContainer,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    Story => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: createTeacherMutationDocument,
              variables: {
                input: {
                  name: "Test Teacher",
                  email: "test@teacher.com",
                  password: "password123",
                  timezone: "America/New_York",
                },
              },
            },
            result: mockTeacherResult,
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TeacherOnboardingContainer>;

export const Default: Story = {
  args: {},
  play: async () => {
    useUserStore.setState({ permissions: [AppPermission.STAFF_CREATE_TEACHER] }, false);
  },
};

export const NoPermission: Story = {
  args: {},
  play: async () => {
    useUserStore.setState({ permissions: [] }, false);
  },
};
```

*Step 2: Update Parent Onboarding Story*

Replace `frontend/views/dashboard/parents/onboarding/ParentOnboardingContainer.stories.tsx`:

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { MockedProvider } from "@apollo/client/testing";
import { ParentOnboardingContainer } from "./ParentOnboardingContainer";
import { createParentMutationDocument } from "@/frontend/graphql/sharedDocuments/parent-onboarding.documents";
import { useUserStore } from "@/frontend/stores/userStore";
import { AppPermission } from "@/shared/lib/enum";

const mockParentResult = {
  data: {
    createParent: {
      __typename: "ParentOnboardingResult",
      userId: "test-user-id-789",
      parentId: "test-parent-id-012",
      name: "Test Parent",
      email: "test@parent.com",
      status: "REGULAR",
      invoiceType: "MONTHLY",
      currency: "USD",
    },
  },
};

const meta: Meta<typeof ParentOnboardingContainer> = {
  title: "Views/dashboard/parents/onboarding/ParentOnboardingContainer",
  component: ParentOnboardingContainer,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    Story => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: createParentMutationDocument,
              variables: {
                input: {
                  name: "Test Parent",
                  email: "test@parent.com",
                  password: "password123",
                  invoiceType: "MONTHLY",
                  feeAmount: "500.00",
                  paymentMethod: "BANK_ACCOUNT",
                  currency: "USD",
                },
              },
            },
            result: mockParentResult,
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ParentOnboardingContainer>;

export const Default: Story = {
  args: {},
  play: async () => {
    useUserStore.setState({ permissions: [AppPermission.PARENT_CREATE_ACCOUNT] }, false);
  },
};

export const NoPermission: Story = {
  args: {},
  play: async () => {
    useUserStore.setState({ permissions: [] }, false);
  },
};
```

*Step 3: Update Manager Onboarding Story*

Replace `frontend/views/dashboard/managers/onboarding/ManagerOnboardingContainer.stories.tsx`:

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { MockedProvider } from "@apollo/client/testing";
import { ManagerOnboardingContainer } from "./ManagerOnboardingContainer";
import { createManagerMutationDocument } from "@/frontend/graphql/sharedDocuments/manager-onboarding.documents";
import { useUserStore } from "@/frontend/stores/userStore";
import { AppPermission } from "@/shared/lib/enum";

const mockManagerResult = {
  data: {
    createManager: {
      __typename: "ManagerOnboardingResult",
      userId: "test-user-id-345",
      staffProfileId: "test-staff-id-678",
      name: "Test Manager",
      email: "test@manager.com",
      status: "ACTIVATED",
      assignedGroupSlug: "staff_default",
    },
  },
};

const meta: Meta<typeof ManagerOnboardingContainer> = {
  title: "Views/dashboard/managers/onboarding/ManagerOnboardingContainer",
  component: ManagerOnboardingContainer,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    Story => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: createManagerMutationDocument,
              variables: {
                input: {
                  name: "Test Manager",
                  email: "test@manager.com",
                  password: "password123",
                  accountType: "manager",
                },
              },
            },
            result: mockManagerResult,
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ManagerOnboardingContainer>;

export const Default: Story = {
  args: {},
  play: async () => {
    useUserStore.setState({ permissions: [AppPermission.MANAGER_CREATE_ACCOUNT] }, false);
  },
};

export const NoPermission: Story = {
  args: {},
  play: async () => {
    useUserStore.setState({ permissions: [] }, false);
  },
};
```

*Step 4: Verify Storybook builds*

```bash
bun storybook --smoke-test
```

Or run the storybook build to verify all stories compile correctly.

**Test Execution Requirements:**
- Verify TypeScript compilation:
  ```bash
  bun tsgo
  ```
- Verify Storybook builds (if available):
  ```bash
  bun storybook --smoke-test
  ```

**Success Criteria / Check Progress Points:**
- [ ] Teacher onboarding story uses `MockedProvider` with mock mutation response
- [ ] Parent onboarding story uses `MockedProvider` with mock mutation response
- [ ] Manager onboarding story uses `MockedProvider` with mock mutation response
- [ ] All stories define mock data as constants with `__typename`
- [ ] All stories keep container as top-level component
- [ ] All stories mock permission gates via `useUserStore.setState`
- [ ] All stories have Default and NoPermission variants
- [ ] `bun tsgo` passes with zero TypeScript errors
- [ ] Stories compile without errors

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
