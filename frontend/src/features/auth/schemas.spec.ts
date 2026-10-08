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
        studentId: "CSE-2023-142",
        batch: "67",
        section: "A",
        departmentId: "ca000000-0000-4000-8000-000000000001",
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional fields omitted or empty", () => {
      const result = registerSchema.safeParse({
        name: "Rafid Hasan",
        email: "rafid@campusos.dev",
        password: "StrongPassword#2026",
      });
      expect(result.success).toBe(true);
    });

    it("rejects password shorter than 8 characters", () => {
      const result = registerSchema.safeParse({
        name: "Rafid Hasan",
        email: "rafid@campusos.dev",
        password: "short",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("8 characters");
      }
    });

    it("rejects invalid UUID departmentId when non-empty", () => {
      const result = registerSchema.safeParse({
        name: "Rafid Hasan",
        email: "rafid@campusos.dev",
        password: "StrongPassword#2026",
        departmentId: "not-a-valid-uuid",
      });
      expect(result.success).toBe(false);
    });
  });
});
