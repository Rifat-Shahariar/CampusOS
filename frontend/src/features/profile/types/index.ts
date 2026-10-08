import type { Department, User, UserRole } from "@/types";

export interface UpdateProfileInput {
  name: string;
  studentId?: string;
  batch?: string;
  section?: string;
  departmentId?: string;
}

export type { Department, User, UserRole };
