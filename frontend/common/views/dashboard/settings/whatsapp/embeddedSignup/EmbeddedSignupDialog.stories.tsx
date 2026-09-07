import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, mocked } from "storybook/test";
import { EmbeddedSignupDialog } from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/EmbeddedSignupDialog";
import {
  type EmbeddedSignupSession,
  useEmbeddedSignupSession,
} from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/useEmbeddedSignupSession";
import { whatsappEn } from "@/shared/locale/en/whatsapp";

function session(overrides: Partial<EmbeddedSignupSession>): EmbeddedSignupSession {
  return {
    phase: "idle",
    codeReceived: false,
    assetsReceived: false,
    launch: fn(),
    reset: fn(),
    ...overrides,
  };
}

function seedSession(overrides: Partial<EmbeddedSignupSession>): void {
  mocked(useEmbeddedSignupSession).mockReturnValue(session(overrides));
}

const meta = {
  title: "Views/dashboard/settings/whatsapp/embeddedSignup/EmbeddedSignupDialog",
  component: EmbeddedSignupDialog,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  beforeEach: () => seedSession({}),
  args: {
    open: true,
    fullScreen: false,
    labels: whatsappEn,
    configId: "cfg-es-123",
    appId: "app-456",
    allowedOriginsUrl: "https://developers.facebook.com/apps/21202248997039/fb-business-login/settings/",
    onComplete: async () => {},
    onClose: fn(),
  },
} satisfies Meta<typeof EmbeddedSignupDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  name: "Idle (step 1 — launch surface)",
};

export const Waiting: Story = {
  name: "Waiting (step 2 — complete in WhatsApp Business app)",
  beforeEach: () => seedSession({ phase: "waiting" }),
};

export const Submitting: Story = {
  name: "Submitting (completion mutation in-flight)",
  beforeEach: () => seedSession({ phase: "submitting", codeReceived: true, assetsReceived: true }),
};

export const ErrorState: Story = {
  name: "Error (session error with retry)",
  beforeEach: () => seedSession({ phase: "error" }),
};

export const Success: Story = {
  beforeEach: () => seedSession({ phase: "success", codeReceived: true, assetsReceived: true }),
};

export const NotConfigured: Story = {
  name: "Not configured (no configId / appId)",
  args: { configId: null, appId: null },
};

export const AllowedOriginsUnavailable: Story = {
  name: "Launch surface without allowed-origins link (URL unresolved)",
  args: { allowedOriginsUrl: null },
};
