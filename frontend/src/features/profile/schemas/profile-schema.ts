import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  studentId: z
    .string()
    .trim()
    .max(50, "Student ID must not exceed 50 characters")
    .optional()
    .or(z.literal("")),
  batch: z
    .string()
    .trim()
    .max(50, "Batch must not exceed 50 characters")
    .optional()
    .or(z.literal("")),
  section: z
    .string()
    .trim()
    .max(20, "Section must not exceed 20 characters")
    .optional()
    .or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
