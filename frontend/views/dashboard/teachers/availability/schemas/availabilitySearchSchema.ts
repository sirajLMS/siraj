import { z } from "zod";

export const availabilitySearchSchema = z.object({
  fromTime: z.date().nullable(),
  toTime: z.date().nullable(),
  gender: z.enum(["any", "male", "female"]),
});

export type AvailabilitySearchFormData = z.infer<typeof availabilitySearchSchema>;
