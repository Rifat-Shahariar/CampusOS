import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileView } from "./profile-view";
import type { User } from "../types";

describe("ProfileView", () => {
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

  it("renders user information correctly", () => {
    const onEdit = vi.fn();
    render(<ProfileView user={mockUser} onEdit={onEdit} />);

    expect(screen.getAllByText("Rafid Hasan").length).toBeGreaterThan(0);
    expect(screen.getAllByText("rafid.hasan@campusos.dev").length).toBeGreaterThan(0);
    expect(screen.getByText("CSE-2023-142")).toBeInTheDocument();
    expect(screen.getByText("67")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getAllByText("STUDENT").length).toBeGreaterThan(0);
    expect(screen.getByText("Active Account")).toBeInTheDocument();
  });

  it("displays department as human-readable name and NEVER displays UUIDs", () => {
    const onEdit = vi.fn();
    const { container } = render(<ProfileView user={mockUser} onEdit={onEdit} />);

    // Department name should be visible
    expect(
      screen.getAllByText("Department of Computer Science & Engineering (CSE)").length,
    ).toBeGreaterThan(0);

    // Check that neither the user UUID nor department UUID is exposed in the rendered text
    expect(container.textContent).not.toContain("usr-00000000-0000-4000-8000-000000000001");
    expect(container.textContent).not.toContain("dept-ca000000-0000-4000-8000-000000000001");
  });

  it("calls onEdit when Edit Profile button is clicked", () => {
    const onEdit = vi.fn();
    render(<ProfileView user={mockUser} onEdit={onEdit} />);

    const editBtn = screen.getByRole("button", { name: /Edit Profile/i });
    fireEvent.click(editBtn);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("displays administrative roles properly without requiring student fields", () => {
    const adminUser: User = {
      ...mockUser,
      role: "ADMIN",
      studentId: null,
      batch: null,
      section: null,
      department: null,
    };

    const onEdit = vi.fn();
    render(<ProfileView user={adminUser} onEdit={onEdit} />);

    expect(screen.getAllByText("ADMIN").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Not provided").length).toBeGreaterThan(0);
    expect(screen.getByText("Not assigned")).toBeInTheDocument();
  });
});
