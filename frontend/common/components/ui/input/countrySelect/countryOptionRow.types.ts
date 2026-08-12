import type { LocaleEmoji } from "@/frontend/common/components/ui/display";
import type { CountryType } from "@/frontend/common/lib/locale";

type LocaleEmojiComponentType = typeof LocaleEmoji;

export type CountryOptionRowProps = {
  readonly country: CountryType;
  readonly locale: string;
  readonly showPhonePrefix?: boolean;
  readonly EmojiComponent?: LocaleEmojiComponentType;
};
