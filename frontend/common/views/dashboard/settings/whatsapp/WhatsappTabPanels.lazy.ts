import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import type {
  NumbersTabSharedProps,
  OptInTabSharedProps,
  TemplatesTabSharedProps,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import type { WhatsappConfigTabViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappConfigView.types";
import type { WhatsappInboxViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";

const lazyNumbersTab = createLazyView<NumbersTabSharedProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile").then(m => ({
      default: m.NumbersTabMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop").then(m => ({
      default: m.NumbersTabDesktop,
    }))
);

const lazyTemplatesTab = createLazyView<TemplatesTabSharedProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/TemplatesTab.mobile").then(m => ({
      default: m.TemplatesTabMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/TemplatesTab.desktop").then(m => ({
      default: m.TemplatesTabDesktop,
    }))
);

const lazyOptInTab = createLazyView<OptInTabSharedProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/OptInTab.mobile").then(m => ({
      default: m.OptInTabMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/OptInTab.desktop").then(m => ({
      default: m.OptInTabDesktop,
    }))
);

const lazyInboxTab = createLazyView<WhatsappInboxViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/InboxTab.mobile").then(m => ({
      default: m.InboxTabMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/InboxTab.desktop").then(m => ({
      default: m.InboxTabDesktop,
    }))
);

const lazyConfigTab = createLazyView<WhatsappConfigTabViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/ConfigTab.mobile").then(m => ({
      default: m.ConfigTabMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/ConfigTab.desktop").then(m => ({
      default: m.ConfigTabDesktop,
    }))
);

export { lazyConfigTab, lazyInboxTab, lazyNumbersTab, lazyOptInTab, lazyTemplatesTab };
