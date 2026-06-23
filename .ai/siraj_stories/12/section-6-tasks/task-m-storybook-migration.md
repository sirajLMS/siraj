### Task M — Storybook: UI Testing & Verification

**Objective:** Write Storybook stories for the new Reports components (`ReportForm`, `ReportDataGrid`, `ReportsContainer`) and update any stories for `ResourceCard` to mock the deletion.

**Dependencies:** Depends on Task K and Task L — UI components must be fully implemented.

**Layer-Specific Rules (Storybook Requirements - Flattened from section-1-core-principles.md):**
- **Storybook MockedProvider migration** — Components relying on Apollo must use `<MockedProvider>` decorators.
- Define mock GraphQL responses using constants inside the story.
- Mock permission gates.

**Target Files:**
- `frontend/views/dashboard/reports/ReportsContainer.stories.tsx`
- `frontend/views/dashboard/resources/components/ResourceCard.stories.tsx`

**Detailed Implementation Steps:**

*Step 1: Write stories for `ReportsContainer`*

```tsx
// frontend/views/dashboard/reports/ReportsContainer.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ReportsContainer } from './ReportsContainer';
import { MockedProvider } from '@apollo/client/testing';
import { generateAttendanceReportQueryDocument } from '../../../../graphql/sharedDocuments/report.documents';
import { ReportGroupingMode } from '../../../../../graphql/generated/gql/graphql-types';
import { PermissionsProvider } from '../../../components/auth/PermissionsContext'; // Mock context
import { AppPermission } from '../../../../shared/lib/enum';

const mockReportData = {
  request: {
    query: generateAttendanceReportQueryDocument,
    variables: {
      filters: {
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        groupBy: ReportGroupingMode.Date
      }
    }
  },
  result: {
    data: {
      generateAttendanceReport: [
        {
          __typename: 'AttendanceReportRow',
          id: '1', groupKey: '2024-01-01', groupLabel: 'Jan 1, 2024',
          takenClasses: 10, absentClasses: 2, leaveClasses: 0, pendingClasses: 0,
          totalHours: 10, paidEGP: 1000, paidUSD: 0
        }
      ]
    }
  }
};

const meta: Meta<typeof ReportsContainer> = {
  title: 'Dashboard/Reports/ReportsContainer',
  component: ReportsContainer,
  decorators: [
    (Story) => (
      <PermissionsProvider mockPermissions={[AppPermission.REPORT_GENERATE_CUSTOM, AppPermission.REPORT_VIEW_FINANCIALS]}>
        <MockedProvider mocks={[mockReportData]} addTypename={true}>
          <Story />
        </MockedProvider>
      </PermissionsProvider>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof ReportsContainer>;

export const Default: Story = {};
```

*Step 2: Update `ResourceCard` stories to mock deletion*

Open `ResourceCard.stories.tsx` and ensure `MockedProvider` provides a success response for `deleteLearningResourceMutationDocument`.

**Test Execution Requirements:**
- Start Storybook to verify rendering.
  ```bash
  bun run storybook
  ```

**Success Criteria / Check Progress Points:**
- [ ] Stories render without crashing.
- [ ] MockedProvider supplies data for queries and mutations.

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
