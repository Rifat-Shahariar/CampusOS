import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { EventRegistrationButton } from "./event-registration-button";
import type { EventDetail } from "../types";

const mockUseAuth = vi.fn();
vi.mock("@/features/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("EventRegistrationButton", () => {
  const mockEvent: EventDetail = {
    id: "e-1",
    title: "Hackathon",
    slug: "hackathon",
    description: "Build products",
    coverImageUrl: null,
    eventType: "Hackathon",
    location: "Lab",
    startTime: new Date(Date.now() + 86400000 * 2).toISOString(),
    endTime: new Date(Date.now() + 86400000 * 3).toISOString(),
    registrationStart: null,
    registrationEnd: null,
    maxAttendees: 100,
    isRegistrationRequired: true,
    isActive: true,
    club: { id: "c-1", name: "Club", slug: "club", logoUrl: null },
    currentAttendeesCount: 10,
    isFull: false,
    isRegistrationOpen: true,
    isUserRegistered: false,
    userRegistrationStatus: null,
    userRegistrationCode: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'Sign In to Register' link for guest visitors", () => {
    mockUseAuth.mockReturnValue({ user: null });

    render(
      <EventRegistrationButton
        event={mockEvent}
        isActionLoading={false}
        actionError={null}
        onRegister={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const link = screen.getByRole("link", { name: /sign in to register/i });
    expect(link).toHaveAttribute("href", "/login?redirect=/events/e-1");
  });

  it("renders administrative account notice for non-student users", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "admin-1", role: "CLUB_ADMIN" },
    });

    render(
      <EventRegistrationButton
        event={mockEvent}
        isActionLoading={false}
        actionError={null}
        onRegister={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/administrative account/i),
    ).toBeInTheDocument();
  });

  it("renders 'Register for Event' button for un-registered student and calls onRegister", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "student-1", role: "STUDENT" },
    });
    const handleRegister = vi.fn().mockResolvedValue({});

    render(
      <EventRegistrationButton
        event={mockEvent}
        isActionLoading={false}
        actionError={null}
        onRegister={handleRegister}
        onCancel={vi.fn()}
      />,
    );

    const registerBtn = screen.getByRole("button", {
      name: /register for event/i,
    });
    expect(registerBtn).toBeInTheDocument();
    fireEvent.click(registerBtn);
    expect(handleRegister).toHaveBeenCalled();
  });

  it("renders 'View QR Ticket' and 'Cancel Registration' for registered student", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "student-1", role: "STUDENT" },
    });
    const registeredEvent: EventDetail = {
      ...mockEvent,
      isUserRegistered: true,
      userRegistrationStatus: "REGISTERED",
      userRegistrationCode: "COS-REG-1001",
    };

    render(
      <EventRegistrationButton
        event={registeredEvent}
        isActionLoading={false}
        actionError={null}
        onRegister={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("You're Registered!")).toBeInTheDocument();
    expect(screen.getByText("COS-REG-1001")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /view qr ticket/i }),
    ).toHaveAttribute("href", "/events/e-1/ticket");
    expect(
      screen.getByRole("button", { name: /cancel registration/i }),
    ).toBeInTheDocument();
  });

  it("renders disabled button when event is at full capacity", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "student-1", role: "STUDENT" },
    });
    const fullEvent: EventDetail = {
      ...mockEvent,
      isFull: true,
      isRegistrationOpen: false,
    };

    render(
      <EventRegistrationButton
        event={fullEvent}
        isActionLoading={false}
        actionError={null}
        onRegister={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const btn = screen.getByRole("button", {
      name: /event full \(capacity reached\)/i,
    });
    expect(btn).toBeDisabled();
  });
});
