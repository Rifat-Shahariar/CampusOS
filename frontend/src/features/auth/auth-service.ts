import { api } from "@/lib/api";
import { tokenStorage } from "@/lib/auth/token-storage";
import type { AuthResponse, User } from "@/types";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  studentId?: string;
  batch?: string;
  section?: string;
  departmentId: string;
}

export interface UpdateProfileData {
  name?: string;
  studentId?: string;
  batch?: string;
  section?: string;
  departmentId?: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const data = await api.post<AuthResponse>("/auth/login", credentials, {
      requiresAuth: false,
    });
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async register(registerData: RegisterData): Promise<AuthResponse> {
    const data = await api.post<AuthResponse>("/auth/register", registerData, {
      requiresAuth: false,
    });
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken }, { requiresAuth: false });
      }
    } catch {
      // Ignore network errors on logout to allow clean local clearance
    } finally {
      tokenStorage.clearTokens();
    }
  },

  async getCurrentUser(): Promise<User> {
    return api.get<User>("/auth/me");
  },

  async updateProfile(data: UpdateProfileData): Promise<User> {
    return api.patch<User>("/auth/me", data);
  },
};
