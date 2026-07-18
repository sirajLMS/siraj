// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/paymentMethod/paymentMethodList.{mobile,desktop}.tsx)
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";

export type PaymentMethodListProps = {
  readonly methods: readonly PaymentMethodRow[];
  readonly loading?: boolean;
  readonly title?: string;
  readonly emptyMessage?: string;
  readonly onEditAction?: (id: string) => void;
  readonly onDeleteAction?: (id: string) => void;
  readonly onSetDefaultAction?: (id: string) => void;
};
