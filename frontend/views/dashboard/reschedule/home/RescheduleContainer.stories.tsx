import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRescheduleStore } from "@/frontend/stores/rescheduleStore";
import { RescheduleView } from "./RescheduleView";
import { type RescheduleFormData, rescheduleSchema } from "./schemas/rescheduleSchema";

export function MockRescheduleContainer() {
  const session = useRescheduleStore(state => state.session);
  const isSubmitting = useRescheduleStore(state => state.isSubmitting);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<RescheduleFormData>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      newDate: "2023-10-24",
      newTime: "22:30",
    },
  });

  return (
    <RescheduleView
      session={session}
      control={control}
      errors={errors}
      setValue={setValue}
      getValues={getValues}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      showSuccess={showSuccess}
      onSubmit={() => {}}
      onCancel={() => {}}
      onDismissSuccess={() => setShowSuccess(false)}
    />
  );
}

const meta: Meta<typeof MockRescheduleContainer> = {
  title: "Views/dashboard/reschedule/home/RescheduleContainer",
  component: MockRescheduleContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof MockRescheduleContainer>;

export const Default: Story = {
  args: {},
};
