import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { ParentLifecycleService } from "@/backend/services";
import {
  AccountStatus as GraphQLAccountStatus,
  ParentStatus as GraphQLParentStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ParentLifecycleContainer } from "@/frontend/common/views/dashboard/parents/lifecycle/ParentLifecycleContainer";

export async function generateMetadata(): Promise<Metadata> {
  return buildTranslatedMetadata(t => t.dashboardTranslations.parentLifecycle.pageTitle);
}

const getGraphqlLifecycleStatus = (backendStatus: string): GraphQLParentStatus => {
  switch (backendStatus) {
    case "REGULAR":
      return GraphQLParentStatus.Regular;
    case "ON_LEAVE":
      return GraphQLParentStatus.OnLeave;
    case "SUSPENDED":
      return GraphQLParentStatus.Suspended;
    case "ON_TRIAL":
      return GraphQLParentStatus.OnTrial;
    default:
      return GraphQLParentStatus.Regular;
  }
};

const getGraphqlAccountStatus = (backendStatus: string): GraphQLAccountStatus => {
  switch (backendStatus) {
    case "ACTIVATED":
      return GraphQLAccountStatus.Activated;
    case "DEACTIVATED":
      return GraphQLAccountStatus.Deactivated;
    default:
      return GraphQLAccountStatus.Activated;
  }
};

export default withPageAuth<{ readonly params: Promise<{ readonly id: string }> }>(null, async (_auth, { params }) => {
  const { id } = await params;
  const parent = await ParentLifecycleService.getParentLifecycleData(id);
  if (!parent) {
    redirect("/parents");
  }

  const graphqlLifecycleStatus = getGraphqlLifecycleStatus(parent.lifecycleStatus);
  const graphqlAccountStatus = getGraphqlAccountStatus(parent.accountStatus);

  return (
    <ParentLifecycleContainer
      parent={{
        id: parent.id,
        userId: parent.userId,
        name: parent.name,
        email: parent.email,
        lifecycleStatus: graphqlLifecycleStatus,
        accountStatus: graphqlAccountStatus,
        avatarUrl: parent.avatarUrl,
      }}
      isUpdating={false}
      onUpdateLifecycle={async () => {}}
    />
  );
});
