import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventTicketView } from "./event-ticket-view";
import type { EventTicket } from "../types";

describe("EventTicketView", () => {
  const mockTicket: EventTicket = {
    id: "reg-1",
    registrationCode: "COS-REG-9999",
    qrToken: "test-qr-token-abc",
    status: "REGISTERED",
    registeredAt: "2026-02-01T00:00:00.000Z",
    event: {
      id: "e-1",
      title: "Spring Hackathon 2026",
      slug: "spring-hackathon-2026",
      eventType: "Hackathon",
      location: "Central Auditorium",
      startTime: "2026-03-10T10:00:00.000Z",
      endTime: "2026-03-12T18:00:00.000Z",
      coverImageUrl: null,
      isActive: true,
      club: {
        id: "c-1",
        name: "Computer Club",
        slug: "computer-club",
        logoUrl: null,
      },
    },
    attendee: {
      id: "u-1",
      name: "Rafid Hasan",
      email: "student1@campusos.dev",
      studentId: "CSE-2023-142",
      batch: "67",
      section: "A",
    },
  };

  it("renders event details, attendee name, and registration code", () => {
    render(
      <EventTicketView
        ticket={mockTicket}
        qrDataUrl="data:image/png;base64,mockQrCode"
      />,
    );

    expect(screen.getByText("Spring Hackathon 2026")).toBeInTheDocument();
    expect(screen.getByText("Computer Club")).toBeInTheDocument();
    expect(screen.getByText("Central Auditorium")).toBeInTheDocument();
    expect(screen.getByText("Rafid Hasan")).toBeInTheDocument();
    expect(screen.getByText("CSE-2023-142")).toBeInTheDocument();
    expect(screen.getByText("student1@campusos.dev")).toBeInTheDocument();
    expect(screen.getByText("COS-REG-9999")).toBeInTheDocument();
  });

  it("renders the generated QR code image when qrDataUrl is provided", () => {
    render(
      <EventTicketView
        ticket={mockTicket}
        qrDataUrl="data:image/png;base64,mockQrCode"
      />,
    );

    const img = screen.getByAltText(/qr ticket for spring hackathon 2026/i);
    expect(img).toHaveAttribute("src", "data:image/png;base64,mockQrCode");
  });

  it("triggers window.print when Print Pass button is clicked", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    render(
      <EventTicketView
        ticket={mockTicket}
        qrDataUrl="data:image/png;base64,mockQrCode"
      />,
    );

    const printBtn = screen.getByRole("button", { name: /print pass/i });
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
