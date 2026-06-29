import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { ParentSuggestionsDesktopView } from "./ParentSuggestionsDesktopView";
import type { SuggestionFormData } from "./schemas/suggestionFormSchema";
import { suggestionFormSchema } from "./schemas/suggestionFormSchema";
import { buildSuggestionsLabels } from "./utils/buildSuggestionsLabels";

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
  const t = useTranslations("dashboard.suggestions");
  const labels = buildSuggestionsLabels(t).parent;
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerifiedAt: new Date().toISOString(),
        email: "sarah.j@example.com",
        __typename: "User" as const,
      };
      useUserStore.setState({ permissions: PARENT_PERMISSIONS, user: mockUser });
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
