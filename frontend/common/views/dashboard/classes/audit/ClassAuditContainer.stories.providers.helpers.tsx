import { InMemoryCache } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing/react";
import { NotificationsProvider } from "@toolpad/core/useNotifications";
import { type ReactNode, useEffect, useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  classInstanceQueryDocument,
  classStatusEventsQueryDocument,
  groupClassAuditQueryDocument,
  resendClassNotificationsMutationDocument,
  updateClassAdminNoteMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useClassAuditStore as classAuditStore } from "@/frontend/common/stores/classAuditStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { seedPermissions } from "@/frontend/common/stories";
import {
  mockAuditData,
  mockStatusEvents,
  STORY_INSTANCE_ID,
} from "@/frontend/common/views/dashboard/classes/audit/ClassAuditContainer.stories.auditFixtures.helpers";
import {
  mockPayrollInstance,
  PAYROLL_PERMISSIONS,
} from "@/frontend/common/views/dashboard/classes/audit/ClassAuditContainer.stories.payrollFixtures.helpers";

/**
 * Seeds the payroll permissions at render time (the deep link and the
 * payroll-gated queries read them during their first render and never
 * re-evaluate the permission selector from store notifications) and then keeps
 * them pinned: the preview-level wrapper rewrites the user store in its own
 * mount effect with a generic permission list, so a synchronous store
 * subscription re-seeds the payroll set the moment any overwrite lands. The
 * audit dialog state resets on unmount so it never leaks into a sibling story.
 */
export function PayrollPermissionsResync({ children }: Readonly<{ children: ReactNode }>) {
  seedPermissions(PAYROLL_PERMISSIONS);
  useEffect(() => {
    const unsubscribe = useUserStore.subscribe(state => {
      if (!state.hasPermission(AppPermission.AccountingPayrollManage)) {
        seedPermissions(PAYROLL_PERMISSIONS);
      }
    });
    return () => {
      unsubscribe();
      classAuditStore.getState().reset();
    };
  }, []);
  return <NotificationsProvider>{children}</NotificationsProvider>;
}

/**
 * Apollo cache pre-warmed with the payroll snapshot and the status timeline:
 * the mock link serves the same payloads, but a pre-populated cache renders the
 * payroll card and the override dialog summary from cache-first reads even if
 * a dev-server hot reload or the double-effect pass under StrictMode drops an
 * in-flight mock fetch. Built per mount so stories never share cache state.
 */
function buildSeededCache(): InMemoryCache {
  const cache = new InMemoryCache();
  cache.writeQuery({
    query: classInstanceQueryDocument,
    variables: { id: STORY_INSTANCE_ID },
    data: mockPayrollInstance,
  });
  cache.writeQuery({
    query: classStatusEventsQueryDocument,
    variables: { classInstanceId: STORY_INSTANCE_ID },
    data: mockStatusEvents,
  });
  return cache;
}

function buildAuditMocks() {
  return [
    {
      request: {
        query: groupClassAuditQueryDocument,
        variables: { classInstanceId: STORY_INSTANCE_ID },
      },
      result: { data: mockAuditData },
    },
    {
      request: {
        query: resendClassNotificationsMutationDocument,
        variables: { classInstanceId: STORY_INSTANCE_ID },
      },
      result: { data: { resendClassNotifications: { id: STORY_INSTANCE_ID, success: true } } },
    },
    {
      request: {
        query: updateClassAdminNoteMutationDocument,
        variables: { classInstanceId: STORY_INSTANCE_ID, content: "Updated note" },
      },
      result: { data: { updateClassAdminNote: mockAuditData.groupClassAudit } },
    },
  ];
}

function buildPayrollMocks() {
  return [
    {
      request: {
        query: classInstanceQueryDocument,
        variables: { id: STORY_INSTANCE_ID },
      },
      result: { data: mockPayrollInstance },
      maxUsageCount: Number.POSITIVE_INFINITY,
    },
    {
      request: {
        query: classStatusEventsQueryDocument,
        variables: { classInstanceId: STORY_INSTANCE_ID },
      },
      result: { data: mockStatusEvents },
      maxUsageCount: Number.POSITIVE_INFINITY,
    },
  ];
}

export function MockedAuditProviders({ children }: Readonly<{ children: ReactNode }>) {
  const cache = useMemo(() => buildSeededCache(), []);
  const mocks = useMemo(() => [...buildAuditMocks(), ...buildPayrollMocks()], []);
  return (
    <MockedProvider cache={cache} mocks={mocks}>
      {children}
    </MockedProvider>
  );
}
