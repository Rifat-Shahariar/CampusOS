import { authService } from "@/features/auth/auth-service";
import { getDepartments as fetchDepartments } from "@/features/auth/api/departments-api";
import type { Department, UpdateProfileInput, User } from "../types";

export const profileApi = {
  async getProfile(): Promise<User> {
    return authService.getCurrentUser();
  },

  async updateProfile(data: UpdateProfileInput): Promise<User> {
    return authService.updateProfile(data);
  },

  async getDepartments(): Promise<Department[]> {
    return fetchDepartments();
  },
};
