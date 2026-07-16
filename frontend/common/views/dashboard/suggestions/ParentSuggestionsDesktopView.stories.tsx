import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { AccountStatus, AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type { SuggestionFormData } from "@/frontend/common/views/dashboard/suggestions/schemas/suggestionFormSchema";
import { suggestionFormSchema } from "@/frontend/common/views/dashboard/suggestions/schemas/suggestionFormSchema";
import { buildSuggestionsLabels } from "@/frontend/common/views/dashboard/suggestions/utils/buildSuggestionsLabels";
import { ParentSuggestionsDesktopView } from "@/frontend/desktop/views/dashboard/suggestions/parentSuggestions.desktop";
import { useAppTranslation } from "@/shared/locale/client";

const PARENT_PERMISSIONS = [AppPermission.CommunicationSubmitSuggestion];

const mockActions = {
  onFormSubmit: () => {
    logger.info("onFormSubmit");
  },
};

interface ParentSuggestionsDesktopStoryProps {
  readonly isSubmitting: boolean;
  readonly canSubmit: boolean;
}

function ParentSuggestionsDesktopStoryRenderer({
  isSubmitting,
  canSubmit,
}: Readonly<ParentSuggestionsDesktopStoryProps>) {
  const t = useAppTranslation();
  const labels = buildSuggestionsLabels(t.dashboardTranslations.suggestions).parent;
  const {
    control,
    formState: { errors },
  } = useForm<SuggestionFormData>({
    resolver: zodResolver(suggestionFormSchema(labels.validation)),
    defaultValues: {
      fullName: "",
      suggestion: "",
    },
  });

  return (
    <ParentSuggestionsDesktopView
      labels={labels}
      control={control}
      errors={errors}
      isSubmitting={isSubmitting}
      canSubmit={canSubmit}
      {...mockActions}
    />
  );
}

const meta: Meta<typeof ParentSuggestionsDesktopStoryRenderer> = {
  title: "Views/dashboard/suggestions/ParentSuggestionsDesktopView",
  component: ParentSuggestionsDesktopStoryRenderer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => {
      const mockUser = {
        id: "mock-parent-id",
        name: "Sarah Jenkins",
        role: "Parent",
        avatarUrl: "",
        permissions: PARENT_PERMISSIONS,
        notificationCount: 0,
        teacherId: null,
        parentId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerifiedAt: new Date().toISOString(),
        email: "sarah.j@example.com",
        __typename: "User" as const,
      };
      useUserStore.setState({
        permissions: PARENT_PERMISSIONS,
        user: {
          ...mockUser,
          phone: null,
          status: AccountStatus.Activated,
          displayCurrency: CurrencyCode.Usd,
        },
      });
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ParentSuggestionsDesktopStoryRenderer>;

export const Default: Story = {
  args: {
    isSubmitting: false,
    canSubmit: true,
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
  },
};

export const Submitting: Story = {
  args: {
    ...Default.args,
    isSubmitting: true,
  },
};
