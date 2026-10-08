import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "./schemas";

describe("Frontend Auth Form Schemas", () => {
  describe("loginSchema", () => {
    it("validates valid login input", () => {
      const result = loginSchema.safeParse({
        email: "student@campusos.dev",
        password: "CampusOS#2026",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty fields", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("rejects invalid email address format", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("validates valid registration input", () => {
      const result = registerSchema.safeParse({
        name: "Rafid Hasan",
        email: "rafid@campusos.dev",
        password: "StrongPassword#2026",
        confirmPassword: "StrongPassword#2026",
        studentId: "CSE-2023-142",
        batch: "67",
        section: "A",
        departmentId: "ca000000-0000-4000-8000-000000000001",
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional fields omitted", () => {
      const result = registerSchema.safeParse({
        name: "Rafid Hasan",
        email: "rafid@campusos.dev",
        password: "StrongPassword#2026",
        confirmPassword: "StrongPassword#2026",
        departmentId: "ca000000-0000-4000-8000-000000000001",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing or empty departmentId", () => {
      const resultMissing = registerSchema.safeParse({
        name: "Rafid Hasan",
        email: "rafid@campusos.dev",
        password: "StrongPassword#2026",
        confirmPassword: "StrongPassword#2026",
      });
      expect(resultMissing.success).toBe(false);

      const resultEmpty = registerSchema.safeParse({
        name: "Rafid Hasan",
        email: "rafid@campusos.dev",
        password: "StrongPassword#2026",
        confirmPassword: "StrongPassword#2026",
        departmentId: "",
      });
      expect(resultEmpty.success).toBe(false);
    });

    it("rejects password shorter than 8 characters", () => {
      const result = registerSchema.safeParse({
        name: "Rafid Hasan",
        email: "rafid@campusos.dev",
        password: "short",
        confirmPassword: "short",
        departmentId: "ca000000-0000-4000-8000-000000000001",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("8 characters");
      }
    });

    it("rejects invalid UUID departmentId", () => {
      const result = registerSchema.safeParse({
        name: "Rafid Hasan",
        email: "rafid@campusos.dev",
        password: "StrongPassword#2026",
        confirmPassword: "StrongPassword#2026",
        departmentId: "not-a-valid-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects when confirmPassword does not match password", () => {
      const result = registerSchema.safeParse({
        name: "Rafid Hasan",
        email: "rafid@campusos.dev",
        password: "StrongPassword#2026",
        confirmPassword: "DifferentPassword#2026",
        departmentId: "ca000000-0000-4000-8000-000000000001",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const mismatchIssue = result.error.issues.find(
          (issue) => issue.path.includes("confirmPassword"),
        );
        expect(mismatchIssue).toBeDefined();
        expect(mismatchIssue?.message).toBe("Passwords do not match");
      }
    });
  });
});
