import { z } from "zod";
import { Gender } from "@/frontend/graphql/generated/gql/graphql-types";

export const availabilitySearchSchema = z.object({
  fromTime: z.date().nullable(),
  toTime: z.date().nullable(),
  gender: z.custom<Gender | null>(
    val => val === null || (typeof val === "string" && Object.values(Gender).includes(val as Gender)),
    {
      message: "Invalid gender value",
    }
  ),
});
