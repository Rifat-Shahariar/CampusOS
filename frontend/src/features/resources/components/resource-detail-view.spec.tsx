import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResourceDetailView } from "./resource-detail-view";
import type { ResourceDetail } from "../types";

describe("ResourceDetailView", () => {
  const mockDetail: ResourceDetail = {
    id: "res-uuid-999",
    courseId: "course-uuid-888",
    title: "SQL Joins & Subqueries Lab Sheet",
    description: "Hands-on exercises covering INNER, LEFT, RIGHT, and FULL OUTER joins.",
    resourceType: "LAB_MANUAL",
    fileName: "sql-joins-lab-02.pdf",
    fileUrl: "https://campusos.dev/uploads/resources/sql-joins-lab-02.pdf",
    fileSize: 2097152, // 2.0 MB
    mimeType: "application/pdf",
    batch: "67",
    section: "B",
    uploadedBy: "admin-1",
    isPublished: true,
    createdAt: "2026-09-15T12:00:00.000Z",
    updatedAt: "2026-09-15T12:00:00.000Z",
    course: {
      id: "course-uuid-888",
      code: "CSE 3101",
      name: "Database Systems",
      department: {
        id: "dept-1",
        code: "CSE",
        name: "Computer Science and Engineering",
      },
    },
    uploader: {
      id: "admin-1",
      name: "Dr. Database",
      fullName: "Dr. Database",
      role: "RESOURCE_ADMIN",
    },
  };

  it("renders complete resource header details, course, and department", () => {
    render(<ResourceDetailView resource={mockDetail} />);

    expect(
      screen.getByRole("heading", { name: "SQL Joins & Subqueries Lab Sheet" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Lab Manual")).toBeInTheDocument();
    expect(screen.getByText("CSE 3101")).toBeInTheDocument();
    expect(screen.getByText(/Database Systems/)).toBeInTheDocument();
    expect(screen.getByText(/Batch 67 • Section B/)).toBeInTheDocument();
    expect(screen.getByText(/Shared by Dr. Database/)).toBeInTheDocument();
  });

  it("renders overview description and file technical information", () => {
    render(<ResourceDetailView resource={mockDetail} />);

    expect(
      screen.getByText(/Hands-on exercises covering INNER, LEFT, RIGHT/),
    ).toBeInTheDocument();
    expect(screen.getByText("sql-joins-lab-02.pdf")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("2.0 MB")).toBeInTheDocument();
    expect(screen.getByText(/application\/pdf/)).toBeInTheDocument();
  });

  it("renders active Download / Open Resource button linking to fileUrl", () => {
    render(<ResourceDetailView resource={mockDetail} />);

    const downloadLink = screen.getByRole("link", {
      name: /Download \/ Open Resource/i,
    });
    expect(downloadLink).toHaveAttribute(
      "href",
      "https://campusos.dev/uploads/resources/sql-joins-lab-02.pdf",
    );
    expect(downloadLink).toHaveAttribute("target", "_blank");
    expect(downloadLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders unavailable notice when fileUrl is empty without crashing", () => {
    const withoutUrl: ResourceDetail = {
      ...mockDetail,
      fileUrl: "",
    };

    render(<ResourceDetailView resource={withoutUrl} />);

    expect(
      screen.getByText("Resource file is temporarily unavailable."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Download \/ Open Resource/i }),
    ).not.toBeInTheDocument();
  });

  it("renders back link to /resources", () => {
    render(<ResourceDetailView resource={mockDetail} />);

    const backLink = screen.getByRole("link", { name: /Back to Resources/i });
    expect(backLink).toHaveAttribute("href", "/resources");
  });
});
