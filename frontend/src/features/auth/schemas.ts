import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid university email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(1, "Full name is required").trim(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid university email address")
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long"),
  studentId: z.string().trim().optional(),
  batch: z.string().trim().optional(),
  section: z.string().trim().optional(),
  departmentId: z
    .string()
    .uuid("Invalid department identifier")
    .optional()
    .or(z.literal("")),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
