import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventCard } from "./event-card";
import type { EventItem } from "../types";

describe("EventCard", () => {
  const mockEvent: EventItem = {
    id: "e0000001-0000-4000-8000-000000000001",
    title: "Campus Hackathon 2026",
    slug: "campus-hackathon-2026",
    description: "Build products and compete in teams.",
    coverImageUrl: null,
    eventType: "Hackathon",
    location: "Auditorium 1",
    startTime: "2026-11-10T10:00:00.000Z",
    endTime: "2026-11-12T18:00:00.000Z",
    registrationStart: "2026-10-01T00:00:00.000Z",
    registrationEnd: "2026-11-09T23:59:59.000Z",
    maxAttendees: 80,
    isRegistrationRequired: true,
    isActive: true,
    club: {
      id: "club-1",
      name: "Computer Club",
      slug: "computer-club",
      logoUrl: null,
    },
    currentAttendeesCount: 25,
    isFull: false,
    isRegistrationOpen: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("renders event title, club name, category, and location", () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByText("Campus Hackathon 2026")).toBeInTheDocument();
    expect(screen.getByText("Computer Club")).toBeInTheDocument();
    expect(screen.getAllByText("Hackathon").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Auditorium 1")).toBeInTheDocument();
  });

  it("renders attendee capacity count", () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByText("25 / 80 attendees")).toBeInTheDocument();
  });

  it("renders link pointing to the event detail route", () => {
    render(<EventCard event={mockEvent} />);

    const link = screen.getByRole("link", { name: "View Details" });
    expect(link).toHaveAttribute(
      "href",
      "/events/e0000001-0000-4000-8000-000000000001",
    );
  });

  it("displays Full badge when event capacity is reached", () => {
    const fullEvent: EventItem = {
      ...mockEvent,
      currentAttendeesCount: 80,
      isFull: true,
      isRegistrationOpen: false,
    };

    render(<EventCard event={fullEvent} />);

    expect(screen.getByText("Full")).toBeInTheDocument();
  });
});
