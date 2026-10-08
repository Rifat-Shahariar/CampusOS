import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ProfileForm } from "./profile-form";
import { profileApi } from "../api/profile-api";
import type { Department, User } from "../types";

describe("ProfileForm", () => {
  const mockDepartments: Department[] = [
    {
      id: "dept-ca000000-0000-4000-8000-000000000001",
      name: "Department of Computer Science & Engineering (CSE)",
      code: "CSE",
    },
    {
      id: "dept-ca000000-0000-4000-8000-000000000002",
      name: "Department of Electrical & Electronic Engineering (EEE)",
      code: "EEE",
    },
  ];

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
    department: mockDepartments[0],
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders form prefilled with user data and displays read-only fields", async () => {
    vi.spyOn(profileApi, "getDepartments").mockResolvedValue(mockDepartments);

    render(
      <ProfileForm
        user={mockUser}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/Full Name \*/i)).toHaveValue("Rafid Hasan");
    expect(screen.getByLabelText(/Email Address/i)).toHaveValue("rafid.hasan@campusos.dev");
    expect(screen.getByLabelText(/Email Address/i)).toBeDisabled();
    expect(screen.getByLabelText(/Student ID \/ Roll/i)).toHaveValue("CSE-2023-142");
    expect(screen.getByLabelText(/Batch/i)).toHaveValue("67");
    expect(screen.getByLabelText(/Section/i)).toHaveValue("A");

    await waitFor(() => {
      expect(
        screen.getByText("Department of Computer Science & Engineering (CSE)"),
      ).toBeInTheDocument();
    });
  });

  it("loads departments and displays human-readable names without exposing UUIDs", async () => {
    vi.spyOn(profileApi, "getDepartments").mockResolvedValue(mockDepartments);

    const { container } = render(
      <ProfileForm
        user={mockUser}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Department of Electrical & Electronic Engineering (EEE)"),
      ).toBeInTheDocument();
    });

    // Check that neither the user UUID nor department UUID is exposed as visible text
    expect(container.textContent).not.toContain("dept-ca000000-0000-4000-8000-000000000001");
    expect(container.textContent).not.toContain("dept-ca000000-0000-4000-8000-000000000002");
  });

  it("validates that full name is required and shows validation error", async () => {
    vi.spyOn(profileApi, "getDepartments").mockResolvedValue(mockDepartments);

    render(
      <ProfileForm
        user={mockUser}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const nameInput = screen.getByLabelText(/Full Name \*/i);
    fireEvent.change(nameInput, { target: { value: "A" } });

    const submitBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Name must be at least 2 characters/i),
      ).toBeInTheDocument();
    });
  });

  it("submits updated profile data and triggers onSuccess callback", async () => {
    vi.spyOn(profileApi, "getDepartments").mockResolvedValue(mockDepartments);

    const updatedUser: User = {
      ...mockUser,
      name: "Rafid Updated",
      batch: "68",
    };
    const updateSpy = vi.spyOn(profileApi, "updateProfile").mockResolvedValue(updatedUser);
    const onSuccess = vi.fn();

    render(
      <ProfileForm
        user={mockUser}
        onSuccess={onSuccess}
        onCancel={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Department of Computer Science & Engineering (CSE)"),
      ).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Full Name \*/i);
    fireEvent.change(nameInput, { target: { value: "Rafid Updated" } });

    const batchInput = screen.getByLabelText(/Batch/i);
    fireEvent.change(batchInput, { target: { value: "68" } });

    const submitBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Rafid Updated",
          batch: "68",
        }),
      );
      expect(onSuccess).toHaveBeenCalledWith(updatedUser);
    });
  });

  it("calls onCancel when Cancel button is clicked", async () => {
    vi.spyOn(profileApi, "getDepartments").mockResolvedValue(mockDepartments);
    const onCancel = vi.fn();

    render(
      <ProfileForm
        user={mockUser}
        onSuccess={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Department of Computer Science & Engineering (CSE)"),
      ).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("displays API error banner when updateProfile fails", async () => {
    vi.spyOn(profileApi, "getDepartments").mockResolvedValue(mockDepartments);
    vi.spyOn(profileApi, "updateProfile").mockRejectedValue(
      new Error("An account with this student ID already exists"),
    );

    render(
      <ProfileForm
        user={mockUser}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("An account with this student ID already exists"),
      ).toBeInTheDocument();
    });
  });
});
