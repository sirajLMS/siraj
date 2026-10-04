"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { WhatsappTemplateStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { whatsappAccountTemplatesQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import type { WhatsappTemplateOption } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";
import type { ComposerState } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.state";
import type { WhatsappConversationsLabels } from "@/shared/locale/types/whatsappConversations";

interface ConversationsTemplatesStackParams {
  readonly labels: WhatsappConversationsLabels;
  readonly composer: ComposerState;
  readonly selectedAccount: { readonly id: string } | null;
}

/** Approved-template pick list feeding the composer's template mode. */
export function useConversationsTemplatesStack({
  labels,
  composer,
  selectedAccount,
}: Readonly<ConversationsTemplatesStackParams>) {
  const templatesQuery = useQuery(whatsappAccountTemplatesQueryDocument, {
    variables: { accountId: selectedAccount?.id ?? "" },
    skip: !selectedAccount,
    fetchPolicy: "cache-and-network",
  });

  const templateOptions = useMemo<WhatsappTemplateOption[]>(
    () =>
      (templatesQuery.data?.whatsappAccountTemplates ?? [])
        .filter(row => row.status === WhatsappTemplateStatus.Approved)
        .map(row => ({
          key: `${row.name ?? ""}|${row.language ?? ""}`,
          name: row.name ?? "",
          language: row.language ?? "",
          category: row.category ?? null,
          bodyText: row.bodyText ?? "",
          paramsCount: row.bodyParamsCount ?? 0,
        })),
    [templatesQuery.data]
  );

  const onTemplateSelect = (option: WhatsappTemplateOption | null) => {
    composer.setTemplateName(option?.name ?? "");
    composer.setTemplateLanguage(option?.language ?? "");
  };

  const onRetryTemplates = () => {
    void templatesQuery.refetch();
  };

  return {
    templateOptions,
    templatesLoading: templatesQuery.loading,
    templatesError: templatesQuery.error !== undefined,
    onRetryTemplates,
    onTemplateSelect,
    templateParamsUnsupportedText: labels.templatePickerParamsUnsupported,
  };
}
