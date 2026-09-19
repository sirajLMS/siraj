"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import type {
  QuotaAutocompleteOption,
  QuotaAutocompleteSlotProps,
} from "@/frontend/common/components/ui/dialog/types/createRecurringClassDialogShared.types";
import { QuotaAutocomplete } from "@/frontend/common/components/ui/input/quotaSelect/QuotaAutocomplete";
import { studentOpenQuotasQueryDocument } from "@/frontend/common/graphql/sharedDocuments";

/** Data-bound wrapper around {@link QuotaAutocomplete}: fetches the student's
 *  open quotas and forwards them as options. Stories target the presentational
 *  component directly, so they stay Apollo-free. */
export function QuotaAutocompleteContainer(props: Readonly<QuotaAutocompleteSlotProps>) {
  const { studentId } = props;

  const { data, loading } = useQuery(studentOpenQuotasQueryDocument, {
    variables: { studentId },
    skip: !studentId,
  });

  const options = useMemo<readonly QuotaAutocompleteOption[]>(() => {
    if (!data?.studentOpenQuotas) return [];
    return data.studentOpenQuotas
      .map(quota => {
        if (!quota?.id) return null;
        return {
          id: quota.id,
          name: quota.name ?? "",
          remaining: quota.remaining ?? 0,
          validUntil: quota.validUntil ?? "",
        } satisfies QuotaAutocompleteOption;
      })
      .filter((opt): opt is QuotaAutocompleteOption => opt !== null);
  }, [data]);

  return <QuotaAutocomplete {...props} options={options} loading={loading} />;
}
