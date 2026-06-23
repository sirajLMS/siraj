### Task I — Storybook Migration: Mock Stores → MockedProvider Hooks, Containers as Top-Level Components

**Objective:** Update all three Storybook story files so they are prepared for the container migration from mock stores to real Apollo `useQuery` hooks. Stories must provide mock data via `MockedProvider` decorators with mock GraphQL responses. The containers remain the top-level story components.

**Dependencies:** Depends on Task G — types extracted to `.types.ts` files. Depends on Task H — GraphQL tests confirm operations work. Also depends on Task K and Task L (Frontend Stores + Views) being completed first — stories use `MockedProvider` to mock the `useQuery` calls that the containers will make after migration. **This task is executed immediately before Tasks K and L to prepare the story infrastructure.**

**Layer-Specific Rules (Storybook — Flattened from AGENTS_STORY_PLANNING.md):**
- **Mock stores preserved for Storybook** — `*.stories.tsx` files MUST keep dummy data, but the data delivery mechanism changes from Zustand stores to `MockedProvider` hooks.
- **Containers are top-level components** — Stories render the actual Container component (e.g., `StudentsContainer`), not a sub-component.
- **No production imports in stories** — Stories must not import from production stores or services.
- **Use `@apollo/client/testing` MockedProvider** — Standard Apollo testing utility for intercepting queries.

**Target Files:**
- `frontend/views/dashboard/students/home/StudentsContainer.stories.tsx` — MODIFY
- `frontend/views/dashboard/managers/home/ManagersContainer.stories.tsx` — MODIFY
- `frontend/views/dashboard/resources/ResourcesContainer.stories.tsx` — MODIFY

---

**Detailed Implementation Steps:**

*Step 1: Update `StudentsContainer.stories.tsx`*

The story needs a `MockedProvider` decorator to intercept Apollo queries and return mock data. Mock data is defined as constants within the story file.

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { MockedProvider } from "@apollo/client/testing";
import { StudentsContainer } from "./StudentsContainer";
import { studentDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/student-directory.documents";

const MOCK_STUDENT_ROWS = [
  {
    __typename: "StudentDirectoryRow" as const,
    id: "student-1",
    name: "Ahmed Hassan",
    email: "ahmed@example.com",
    status: "REGULAR",
    classesRemaining: 12,
    classesTotal: 24,
    hoursPerWeek: "3.50",
    parentName: "Fatima Hassan",
    teacherName: "Sarah Johnson",
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    __typename: "StudentDirectoryRow" as const,
    id: "student-2",
    name: "Omar Ali",
    email: "omar@example.com",
    status: "SUSPENDED",
    classesRemaining: 8,
    classesTotal: 20,
    hoursPerWeek: "2.00",
    parentName: "Khalid Ali",
    teacherName: "Michael Brown",
    createdAt: "2025-02-20T14:30:00Z",
  },
  {
    __typename: "StudentDirectoryRow" as const,
    id: "student-3",
    name: "Layla Ibrahim",
    email: "layla@example.com",
    status: "ON_LEAVE",
    classesRemaining: 15,
    classesTotal: 30,
    hoursPerWeek: "4.00",
    parentName: "Sara Ibrahim",
    teacherName: null,
    createdAt: "2025-03-01T08:00:00Z",
  },
];

const studentDirectoryMocks = [
  {
    request: {
      query: studentDirectoryQueryDocument,
      variables: {},
    },
    result: {
      data: {
        studentDirectory: {
          __typename: "StudentDirectoryResult",
          rows: MOCK_STUDENT_ROWS,
          totalCount: MOCK_STUDENT_ROWS.length,
        },
      },
    },
  },
];

const meta: Meta<typeof StudentsContainer> = {
  title: "Views/dashboard/students/home/StudentsContainer",
  component: StudentsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={studentDirectoryMocks} addTypename={true}>
        <Story />
      </MockedProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StudentsContainer>;

export const Default: Story = {
  args: {},
};

export const Empty: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: { query: studentDirectoryQueryDocument, variables: {} },
            result: {
              data: {
                studentDirectory: { __typename: "StudentDirectoryResult", rows: [], totalCount: 0 },
              },
            },
          },
        ]}
        addTypename={true}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};
```

**Permission mocking:** If `<RequirePermission>` reads from a context or store, add a decorator that provides the needed permissions. Check `<RequirePermission>` implementation and mock accordingly.

---

*Step 2: Update `ManagersContainer.stories.tsx`*

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { MockedProvider } from "@apollo/client/testing";
import { ManagersContainer } from "./ManagersContainer";
import { managerDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/staff-directory.documents";

const MOCK_MANAGER_ROWS = [
  {
    __typename: "ManagerDirectoryRow" as const,
    id: "user-admin-1",
    staffProfileId: "staff-1",
    name: "Admin User",
    email: "admin@academy.com",
    phone: "+1-555-0100",
    skypeId: "admin.skype",
    status: "ACTIVE",
    roleSlug: "super_admin",
    roleName: "Super Admin",
  },
  {
    __typename: "ManagerDirectoryRow" as const,
    id: "user-staff-1",
    staffProfileId: "staff-2",
    name: "Staff Member",
    email: "staff@academy.com",
    phone: "+1-555-0200",
    skypeId: "staff.skype",
    status: "ACTIVE",
    roleSlug: "staff_default",
    roleName: "Staff Default",
  },
];

const managerDirectoryMocks = [
  {
    request: {
      query: managerDirectoryQueryDocument,
    },
    result: {
      data: {
        managerDirectory: MOCK_MANAGER_ROWS,
      },
    },
  },
];

const meta: Meta<typeof ManagersContainer> = {
  title: "Views/dashboard/managers/home/ManagersContainer",
  component: ManagersContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={managerDirectoryMocks} addTypename={true}>
        <Story />
      </MockedProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ManagersContainer>;

export const Default: Story = {
  args: {},
};

export const Empty: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: { query: managerDirectoryQueryDocument },
            result: { data: { managerDirectory: [] } },
          },
        ]}
        addTypename={true}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};
```

---

*Step 3: Update `ResourcesContainer.stories.tsx`*

Resources has both a query and a mutation — the story needs mocks for both.

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { MockedProvider } from "@apollo/client/testing";
import { ResourcesContainer } from "./ResourcesContainer";
import {
  learningResourcesQueryDocument,
  uploadLearningResourceMutationDocument,
} from "@/frontend/graphql/sharedDocuments/learning-resource.documents";

const MOCK_RESOURCE_ROWS = [
  {
    __typename: "LearningResourceRow" as const,
    id: "res-1",
    displayName: "English Grammar Handbook",
    filePath: "/resources/grammar-handbook.pdf",
    uploadedByUserId: "user-admin-1",
    uploadedByUserName: "Admin User",
    fileSize: 2450000,
    contentType: "application/pdf",
    createdAt: "2025-03-01T09:00:00Z",
  },
  {
    __typename: "LearningResourceRow" as const,
    id: "res-2",
    displayName: "Math Worksheets Grade 5",
    filePath: "/resources/math-worksheets.xlsx",
    uploadedByUserId: "user-admin-1",
    uploadedByUserName: "Admin User",
    fileSize: 890000,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    createdAt: "2025-03-10T11:30:00Z",
  },
];

const resourceMocks = [
  {
    request: {
      query: learningResourcesQueryDocument,
      variables: {},
    },
    result: {
      data: {
        learningResources: MOCK_RESOURCE_ROWS,
      },
    },
  },
  {
    request: {
      query: uploadLearningResourceMutationDocument,
      variables: {
        input: {
          displayName: "New Document",
          filePath: "/resources/new-doc.pdf",
          fileId: "file-new-1",
        },
      },
    },
    result: {
      data: {
        uploadLearningResource: {
          __typename: "LearningResourceRow",
          id: "res-new",
          displayName: "New Document",
          filePath: "/resources/new-doc.pdf",
          uploadedByUserId: "user-admin-1",
          uploadedByUserName: "Admin User",
          fileSize: 500000,
          contentType: "application/pdf",
          createdAt: new Date().toISOString(),
        },
      },
    },
  },
];

const meta: Meta<typeof ResourcesContainer> = {
  title: "Views/dashboard/resources/ResourcesContainer",
  component: ResourcesContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={resourceMocks} addTypename={true}>
        <Story />
      </MockedProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ResourcesContainer>;

export const Default: Story = {
  args: {},
};

export const Empty: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: { query: learningResourcesQueryDocument, variables: {} },
            result: { data: { learningResources: [] } },
          },
        ]}
        addTypename={true}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};
```

---

*Step 4: Handle permission mocking*

All three containers will have `<RequirePermission>` gates after Task L. The stories need to bypass or mock this gate. Check the implementation of `<RequirePermission>`:

**If `<RequirePermission>` uses a React context:**
- Add a decorator that wraps with the context provider, supplying all needed permissions.

**If `<RequirePermission>` uses `useUserStore` (from `mockUserStore`):**
- The story can import `mockUserStore` and set permissions before rendering:
```typescript
decorators: [
  (Story) => {
    useUserStore.setState({
      permissions: [AppPermission.StudentsList, AppPermission.StaffViewDirectory, AppPermission.ResourcesList],
    });
    return (
      <MockedProvider mocks={mocks} addTypename={true}>
        <Story />
      </MockedProvider>
    );
  },
],
```

**The exact approach depends on the `<RequirePermission>` implementation.** During execution, check how it resolves permissions and mock accordingly.

---

**Test Execution Requirements:**
- Run TypeScript check:
  ```bash
  bun tsgo
  ```
- Run Storybook build (if available):
  ```bash
  bun run build-storybook
  ```

**Success Criteria / Check Progress Points:**
- [ ] `StudentsContainer.stories.tsx` uses `MockedProvider` with mock GraphQL responses.
- [ ] `ManagersContainer.stories.tsx` uses `MockedProvider` with mock GraphQL responses.
- [ ] `ResourcesContainer.stories.tsx` uses `MockedProvider` with mock query + mutation responses.
- [ ] Mock data uses generated GraphQL type shapes (with `__typename`), not old mock store shapes.
- [ ] Stories render containers as top-level components.
- [ ] Permission gates are properly mocked so containers render.
- [ ] Empty state stories work (0 rows returned).
- [ ] No imports from production stores in story files.
- [ ] Mock data is defined as constants within the story files, not imported from mock stores.
- [ ] `bun tsgo` passes with 0 errors.

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
