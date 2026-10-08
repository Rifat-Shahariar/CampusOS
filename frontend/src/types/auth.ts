export const UserRole = {
  ADMIN: "ADMIN",
  CLUB_ADMIN: "CLUB_ADMIN",
  RESOURCE_ADMIN: "RESOURCE_ADMIN",
  STUDENT: "STUDENT",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  studentId: string | null;
  batch: string | null;
  section: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  department?: Department | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}
