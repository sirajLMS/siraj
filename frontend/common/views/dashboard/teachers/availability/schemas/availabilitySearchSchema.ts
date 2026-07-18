import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
import { Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { AvailabilitySearchFormData } from "@/frontend/common/views/dashboard/teachers/availability/types";

export const availabilitySearchSchema = z.object({
  fromTime: z.date().nullable(),
  toTime: z.date().nullable(),
  gender: z.custom<Gender | null>(
    val => val === null || (typeof val === "string" && (Object.values(Gender) as readonly string[]).includes(val)),
    {
      message: "Invalid gender value",
    }
  ),
});

// NEW FOR PLAN v5: availabilitySearchResolver — pre-built `zodResolver` for
// the availability search form. Per specs.md §3 N4, `zodResolver` must NOT
// be instantiated inside a tier file; the tier files now import this single
// resolver instance (built here in common) and pass it directly to
// `useForm({ resolver })`.
export const availabilitySearchResolver: Resolver<AvailabilitySearchFormData> = zodResolver(availabilitySearchSchema);
