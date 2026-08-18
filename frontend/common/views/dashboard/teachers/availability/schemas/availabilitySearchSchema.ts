import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
import { Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { AvailabilitySearchFormData } from "@/frontend/common/views/dashboard/teachers/availability/types";

export type AvailabilitySearchValidationLabels = {
  readonly invalidGender: string;
};

export const availabilitySearchSchemaFactory = (labels: AvailabilitySearchValidationLabels) =>
  z.object({
    fromTime: z.date().nullable(),
    toTime: z.date().nullable(),
    gender: z.custom<Gender | null>(
      val => val === null || (typeof val === "string" && (Object.values(Gender) as readonly string[]).includes(val)),
      {
        message: labels.invalidGender,
      }
    ),
  });

// NEW FOR PLAN v5: availabilitySearchResolverFactory — builds a `zodResolver`
// for the availability search form with translated validation labels. Per
// specs.md §3 N4, `zodResolver` must NOT be instantiated inside a tier file;
// the tier files call this factory and pass the result directly to
// `useForm({ resolver })`.
export const availabilitySearchResolverFactory = (
  labels: AvailabilitySearchValidationLabels
): Resolver<AvailabilitySearchFormData> => zodResolver(availabilitySearchSchemaFactory(labels));
