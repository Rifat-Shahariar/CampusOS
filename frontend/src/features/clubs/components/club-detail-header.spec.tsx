import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClubDetailHeader } from "./club-detail-header";
import type { Club } from "../types";

describe("ClubDetailHeader", () => {
  const mockClub: Club = {
    id: "c0000001-0000-4000-8000-000000000001",
    name: "Robotics Society",
    slug: "robotics-society",
    description: "Building autonomous systems and competitive bots.",
    logoUrl: "https://campusos.dev/robotics-logo.png",
    coverImageUrl: "https://campusos.dev/robotics-cover.jpg",
    contactEmail: "robotics@campusos.dev",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    _count: {
      events: 5,
      posts: 3,
    },
  };

  it("renders club header with title, description, and stats", () => {
    render(<ClubDetailHeader club={mockClub} />);

    expect(screen.getByRole("heading", { level: 1, name: "Robotics Society" })).toBeInTheDocument();
    expect(
      screen.getByText("Building autonomous systems and competitive bots."),
    ).toBeInTheDocument();
    expect(screen.getByText("robotics@campusos.dev")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Campus Events")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Announcements")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to All Clubs/i }),
    ).toHaveAttribute("href", "/clubs");
  });
});
