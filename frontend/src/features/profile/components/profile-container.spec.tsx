import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ProfileContainer } from "./profile-container";
import * as authContextModule from "@/features/auth/auth-context";
import { profileApi } from "../api/profile-api";
import type { User } from "../types";

describe("ProfileContainer", () => {
  const mockUser: User = {
    id: "usr-00000000-0000-4000-8000-000000000001",
    name: "Rafid Hasan",
    email: "rafid.hasan@campusos.dev",
    studentId: "CSE-2023-142",
    batch: "67",
    section: "A",
    role: "STUDENT",
    avatarUrl: null,
    isActive: true,
    department: {
      id: "dept-ca000000-0000-4000-8000-000000000001",
      name: "Department of Computer Science & Engineering (CSE)",
      code: "CSE",
    },
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
  };

  const mockUpdateUser = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authContextModule, "useAuth").mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      updateUser: mockUpdateUser,
    });
    vi.spyOn(profileApi, "getDepartments").mockResolvedValue([
      mockUser.department!,
    ]);
  });

  it("renders ProfileView initially and switches to edit mode on click", async () => {
    render(<ProfileContainer />);

    expect(screen.getByRole("button", { name: /Edit Profile/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Edit Profile/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Save Changes/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
      expect(
        screen.getByText("Department of Computer Science & Engineering (CSE)"),
      ).toBeInTheDocument();
    });
  });

  it("restores ProfileView when Cancel is clicked in edit mode", async () => {
    render(<ProfileContainer />);

    fireEvent.click(screen.getByRole("button", { name: /Edit Profile/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
      expect(
        screen.getByText("Department of Computer Science & Engineering (CSE)"),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(screen.getByRole("button", { name: /Edit Profile/i })).toBeInTheDocument();
  });

  it("handles successful update by refreshing AuthContext and displaying success alert", async () => {
    const updatedUser: User = {
      ...mockUser,
      name: "Rafid Updated Name",
    };
    vi.spyOn(profileApi, "updateProfile").mockResolvedValue(updatedUser);

    render(<ProfileContainer />);

    // Switch to edit mode
    fireEvent.click(screen.getByRole("button", { name: /Edit Profile/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Department of Computer Science & Engineering (CSE)"),
      ).toBeInTheDocument();
    });

    // Change name
    const nameInput = screen.getByLabelText(/Full Name \*/i);
    fireEvent.change(nameInput, { target: { value: "Rafid Updated Name" } });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith(updatedUser);
      expect(
        screen.getByText(/Your profile information has been updated successfully/i),
      ).toBeInTheDocument();
      // Restored back to view mode
      expect(screen.getByRole("button", { name: /Edit Profile/i })).toBeInTheDocument();
    });
  });
});
