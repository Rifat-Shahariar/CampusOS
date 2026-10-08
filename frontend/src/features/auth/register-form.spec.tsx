import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { RegisterForm } from "./register-form";
import * as departmentsApi from "./api/departments-api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("./auth-context", () => ({
  useAuth: () => ({
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    user: null,
    isLoading: false,
    isAuthenticated: false,
    refreshUser: vi.fn(),
  }),
}));

describe("RegisterForm", () => {
  const mockDepartments = [
    {
      id: "ca000000-0000-4000-8000-000000000001",
      name: "Department of Computer Science & Engineering (CSE)",
      code: "CSE",
    },
    {
      id: "ca000000-0000-4000-8000-000000000002",
      name: "Department of Electrical & Electronic Engineering (EEE)",
      code: "EEE",
    },
    {
      id: "ca000000-0000-4000-8000-000000000003",
      name: "Department of Mechanical Engineering",
      code: "ME",
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all required registration fields including Department and Confirm Password", async () => {
    vi.spyOn(departmentsApi, "getDepartments").mockResolvedValue(mockDepartments);

    render(<RegisterForm />);

    await waitFor(() => {
      expect(
        screen.getByText("Department of Computer Science & Engineering (CSE)"),
      ).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Full Name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/University Email \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Student ID \/ Roll/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Department \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password \*/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Register as Student/i }),
    ).toBeInTheDocument();
  });

  it("renders human-readable department names in the dropdown and hides UUIDs", async () => {
    vi.spyOn(departmentsApi, "getDepartments").mockResolvedValue(mockDepartments);

    render(<RegisterForm />);

    await waitFor(() => {
      expect(
        screen.getByText("Department of Computer Science & Engineering (CSE)"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Department of Electrical & Electronic Engineering (EEE)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Department of Mechanical Engineering"),
    ).toBeInTheDocument();

    // Verify UUID text is NEVER visible in labels, placeholders, or visible text
    const formText = document.body.textContent || "";
    expect(formText).not.toContain("UUID");
    expect(formText).not.toContain("ca000000-0000-4000-8000-000000000001");
    expect(formText).not.toContain("ca000000-0000-4000-8000-000000000002");
  });

  it("displays loading state while departments are being fetched", () => {
    // Unresolved promise simulates in-flight request
    vi.spyOn(departmentsApi, "getDepartments").mockReturnValue(
      new Promise(() => {}),
    );

    render(<RegisterForm />);

    expect(screen.getByText("Loading departments...")).toBeInTheDocument();
  });

  it("displays an error message when department fetching fails", async () => {
    vi.spyOn(departmentsApi, "getDepartments").mockRejectedValue(
      new Error("Network Error"),
    );

    render(<RegisterForm />);

    await waitFor(() => {
      expect(
        screen.getByText(/Unable to load departments/i),
      ).toBeInTheDocument();
    });
  });

  it("toggles password field visibility between password and text", async () => {
    vi.spyOn(departmentsApi, "getDepartments").mockResolvedValue(mockDepartments);

    render(<RegisterForm />);

    await waitFor(() => {
      expect(
        screen.getByText("Department of Computer Science & Engineering (CSE)"),
      ).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/^Password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByRole("button", { name: /Show password/i });
    fireEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /Hide password/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Hide password/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("toggles confirm password field visibility between password and text", async () => {
    vi.spyOn(departmentsApi, "getDepartments").mockResolvedValue(mockDepartments);

    render(<RegisterForm />);

    await waitFor(() => {
      expect(
        screen.getByText("Department of Computer Science & Engineering (CSE)"),
      ).toBeInTheDocument();
    });

    const confirmPasswordInput = screen.getByLabelText(/Confirm Password \*/i);
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByRole("button", { name: /Show confirm password/i });
    fireEvent.click(toggleBtn);

    expect(confirmPasswordInput).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: /Hide confirm password/i }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Hide confirm password/i }),
    );
    expect(confirmPasswordInput).toHaveAttribute("type", "password");
  });
});
