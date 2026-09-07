import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent } from "storybook/test";
import { CreateAccountDialog } from "@/frontend/common/views/dashboard/settings/whatsapp/createAccountDialog/CreateAccountDialog";
import { whatsappEn } from "@/shared/locale/en/whatsapp";

const ok: (value: string) => string | null = () => null;

const meta = {
  title: "Views/dashboard/settings/whatsapp/createAccountDialog/CreateAccountDialog",
  component: CreateAccountDialog,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    open: true,
    labels: whatsappEn,
    loading: false,
    mutationError: null,
    onClose: fn(),
    onSubmit: async () => {},
    validateDisplayName: ok,
    validatePhoneNumberId: ok,
    validateWabaId: ok,
    validatePurpose: ok,
  },
} satisfies Meta<typeof CreateAccountDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Open (empty form)",
};

export const Loading: Story = {
  name: "Submitting",
  args: { loading: true },
};

export const MutationError: Story = {
  name: "Server mutation error banner",
  args: { mutationError: "A WhatsApp number with this phone number ID already exists." },
};

export const ValidationErrors: Story = {
  name: "Field validation errors after submit",
  args: {
    validateDisplayName: () => "validationDisplayNameRequired",
    validatePhoneNumberId: () => "validationPhoneNumberIdRequired",
    validateWabaId: () => "validationWabaIdRequired",
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: whatsappEn.save }));
    await expect(await canvas.findByText(whatsappEn.validationDisplayNameRequired)).toBeVisible();
    await expect(canvas.getByText(whatsappEn.validationPhoneNumberIdRequired)).toBeVisible();
    await expect(canvas.getByText(whatsappEn.validationWabaIdRequired)).toBeVisible();
  },
};
