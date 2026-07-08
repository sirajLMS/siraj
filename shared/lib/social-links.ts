import { isSafeUrl } from "@/frontend/lib/safeRedirect";

export type SocialLink = {
  readonly href: string;
  readonly displayText: string;
};

export type SocialPlatform = "whatsapp" | "facebook" | "twitter" | "zoom";

function buildWhatsAppLink(value: string): SocialLink {
  const digits = value.replace(/[^\d]/g, "");
  return {
    href: `https://wa.me/${digits}`,
    displayText: value,
  };
}

function buildFacebookLink(value: string): SocialLink {
  const hasProtocol = /^https?:\/\//.test(value);
  const normalized = hasProtocol ? value : `https://${value}`;
  return {
    href: normalized,
    displayText: value,
  };
}

function buildTwitterLink(value: string): SocialLink {
  let handle = value;
  if (handle.startsWith("@")) {
    handle = handle.slice(1);
  }
  if (handle.startsWith("twitter.com/")) {
    handle = handle.slice("twitter.com/".length);
  }
  return {
    href: `https://twitter.com/${handle}`,
    displayText: handle,
  };
}

function buildZoomLink(value: string): SocialLink | null {
  const safeUrl = isSafeUrl(value);
  if (!safeUrl) {
    return null;
  }
  return {
    href: safeUrl,
    displayText: value,
  };
}

export function buildSocialLink(platform: SocialPlatform, value: string | null | undefined): SocialLink | null {
  if (!value || value.trim() === "") {
    return null;
  }

  const trimmed = value.trim();

  switch (platform) {
    case "whatsapp":
      return buildWhatsAppLink(trimmed);
    case "facebook":
      return buildFacebookLink(trimmed);
    case "twitter":
      return buildTwitterLink(trimmed);
    case "zoom":
      return buildZoomLink(trimmed);
    default:
      return null;
  }
}
