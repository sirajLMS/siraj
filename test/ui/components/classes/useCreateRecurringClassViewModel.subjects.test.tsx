import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import type { ClassSubjectsQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { classSubjectsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/class-subject.documents";
import {
  type CreateRecurringClassViewModel,
  useCreateRecurringClassViewModel,
} from "@/frontend/common/views/dashboard/classes/recurring/useCreateRecurringClassViewModel";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

await mockNextNavigation();

const locale: AppLocale = "en";

function makeSubject(id: string, name: string | null, isActive: boolean) {
  return {
    id,
    name,
    slug: null,
    description: null,
    avatarUrl: null,
    isActive,
    sortOrder: null,
    categoryId: null,
    hourlyRate: null,
    rateCurrency: null,
    category: null,
    resources: null,
  };
}

let classSubjectsCalls = 0;

const classSubjectsMock = {
  request: { query: classSubjectsQueryDocument, variables: { categoryId: null } },
  result: (): { data: ClassSubjectsQuery } => {
    classSubjectsCalls += 1;
    return {
      data: {
        classSubjects: [
          makeSubject("subject-a", "Mathematics", true),
          makeSubject("subject-b", null, true),
          makeSubject("subject-c", "Archived Subject", false),
        ],
      },
    };
  },
};

let latestViewModel: CreateRecurringClassViewModel | null = null;

// renderHook is unavailable in bun:test — capture the view model via a
// consumer component writing into a ref on every render.
function ViewModelConsumer() {
  const viewModel = useCreateRecurringClassViewModel();
  useEffect(() => {
    latestViewModel = viewModel;
  });
  return <div data-testid="consumer" />;
}

describe("useCreateRecurringClassViewModel subjects", () => {
  afterEach(() => {
    cleanup();
    latestViewModel = null;
  });

  test("fires the classSubjects query once and projects active subjects to options", async () => {
    classSubjectsCalls = 0;
    render(<ViewModelConsumer />, {
      wrapper: ({ children }) => (
        <TestWrapper locale={locale} mocks={[classSubjectsMock]}>
          {children}
        </TestWrapper>
      ),
    });

    await waitFor(() => {
      expect(latestViewModel?.subjectsLoading).toBe(false);
    });

    expect(classSubjectsCalls).toBe(1);
    expect(latestViewModel?.subjects).toEqual([
      { id: "subject-a", name: "Mathematics" },
      { id: "subject-b", name: "subject-b" },
    ]);
  });
});
