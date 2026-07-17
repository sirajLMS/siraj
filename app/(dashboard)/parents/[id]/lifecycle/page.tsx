import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { ParentLifecycleService } from "@/backend/services/parent/parent-lifecycle.service";
import {
  AccountStatus as GraphQLAccountStatus,
  ParentStatus as GraphQLParentStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ParentLifecycleContainer } from "@/frontend/common/views/dashboard/parents/lifecycle/ParentLifecycleContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.parentLifecycle;
  return { title: t.pageTitle };
}

export default async function ParentLifecyclePage({
  params,
}: {
  readonly params: Promise<{ readonly locale: string; readonly id: string }>;
}) {
  const { locale, id } = await params;
  const { userId, context } = await getServerUserContext();
  if (!userId || !context) {
    redirect(`/${locale}/login`);
  }

  const parent = await ParentLifecycleService.getParentLifecycleData(id);
  if (!parent) {
    redirect(`/${locale}/parents`);
  }

  // Convert backend enums to GraphQL enums
  const backendLifecycleStatus = parent.lifecycleStatus;
  const backendAccountStatus = parent.accountStatus;

  const graphqlLifecycleStatus: GraphQLParentStatus =
    backendLifecycleStatus === "REGULAR"
      ? GraphQLParentStatus.Regular
      : backendLifecycleStatus === "ON_LEAVE"
        ? GraphQLParentStatus.OnLeave
        : backendLifecycleStatus === "SUSPENDED"
          ? GraphQLParentStatus.Suspended
          : backendLifecycleStatus === "ON_TRIAL"
            ? GraphQLParentStatus.OnTrial
            : GraphQLParentStatus.Regular;

  const graphqlAccountStatus: GraphQLAccountStatus =
    backendAccountStatus === "ACTIVATED"
      ? GraphQLAccountStatus.Activated
      : backendAccountStatus === "DEACTIVATED"
        ? GraphQLAccountStatus.Deactivated
        : GraphQLAccountStatus.Activated;

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
