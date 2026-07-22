import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { ParentLifecycleService } from "@/backend/services/parent/parent-lifecycle.service";
import {
  AccountStatus as GraphQLAccountStatus,
  ParentStatus as GraphQLParentStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { ParentLifecycleContainer } from "@/frontend/common/views/dashboard/parents/lifecycle/ParentLifecycleContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.parentLifecycle;
  return { title: t.pageTitle };
}

export default async function ParentLifecyclePage({ params }: { readonly params: Promise<{ readonly id: string }> }) {
  const { id } = await params;
  const { userId, context } = await getServerUserContext();
  if (!userId || !context) {
    await redirectToLogin();
  }

  const parent = await ParentLifecycleService.getParentLifecycleData(id);
  if (!parent) {
    redirect("/parents");
  }

  // Convert backend enums to GraphQL enums
  const backendLifecycleStatus = parent.lifecycleStatus;
  const backendAccountStatus = parent.accountStatus;

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

  const graphqlLifecycleStatus = getGraphqlLifecycleStatus(backendLifecycleStatus);
  const graphqlAccountStatus = getGraphqlAccountStatus(backendAccountStatus);

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
}
