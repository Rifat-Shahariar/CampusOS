import { api } from "@/lib/api";
import type { Department } from "@/types";

/**
 * Public API method to fetch active university departments for student registration.
 */
export async function getDepartments(): Promise<Department[]> {
  return api.get<Department[]>("/departments", { requiresAuth: false });
}
