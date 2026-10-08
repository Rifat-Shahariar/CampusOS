import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid university email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(1, "Full name is required").trim(),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid university email address")
      .trim(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
    studentId: z.string().trim().optional(),
    batch: z.string().trim().optional(),
    section: z.string().trim().optional(),
    departmentId: z
      .string()
      .min(1, "Please select your department")
      .uuid("Invalid department selected"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
