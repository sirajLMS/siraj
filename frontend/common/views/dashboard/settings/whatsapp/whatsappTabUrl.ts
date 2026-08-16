"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  TAB_IDS,
  type WhatsappConfigTab,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappConfig.constants";

function isWhatsappConfigTab(value: string | null): value is WhatsappConfigTab {
  return value !== null && (TAB_IDS as readonly string[]).includes(value);
}

export function useWhatsappTab(): [WhatsappConfigTab, (tab: WhatsappConfigTab) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const activeTab: WhatsappConfigTab = isWhatsappConfigTab(tabParam) ? tabParam : TAB_IDS[0];

  const setActiveTab = (tab: WhatsappConfigTab): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/settings/whatsapp?${params.toString()}`, { scroll: false });
  };

  return [activeTab, setActiveTab];
}
