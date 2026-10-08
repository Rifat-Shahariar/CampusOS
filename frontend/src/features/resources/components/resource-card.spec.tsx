import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResourceCard } from "./resource-card";
import type { ResourceItem } from "../types";

describe("ResourceCard", () => {
  const mockResource: ResourceItem = {
    id: "res-uuid-101",
    courseId: "course-uuid-202",
    title: "Graph Algorithms — DFS and BFS",
    description: "Detailed traversal notes with pseudo-code and edge classifications.",
    resourceType: "NOTE",
    fileName: "dfs-bfs-graphs.pdf",
    fileUrl: "https://campusos.dev/uploads/resources/dfs-bfs-graphs.pdf",
    fileSize: 1572864, // 1.5 MB
    mimeType: "application/pdf",
    batch: "67",
    section: "A",
    uploadedBy: "user-admin-1",
    isPublished: true,
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
    course: {
      id: "course-uuid-202",
      code: "CSE 2115",
      name: "Data Structures",
      semester: 4,
      department: {
        id: "dept-1",
        code: "CSE",
        name: "Computer Science and Engineering",
      },
    },
    uploader: {
      id: "user-admin-1",
      name: "Prof. Alan",
      fullName: "Prof. Alan",
      role: "RESOURCE_ADMIN",
    },
  };

  it("renders resource title, category badge, and course information", () => {
    render(<ResourceCard resource={mockResource} />);

    expect(screen.getByText("Graph Algorithms — DFS and BFS")).toBeInTheDocument();
    expect(screen.getByText("Lecture Note")).toBeInTheDocument();
    expect(screen.getByText("CSE 2115")).toBeInTheDocument();
    expect(screen.getByText(/Data Structures/)).toBeInTheDocument();
    expect(screen.getByText(/Batch 67 • Sec A/)).toBeInTheDocument();
  });

  it("renders file metadata correctly (name, extension, size)", () => {
    render(<ResourceCard resource={mockResource} />);

    expect(screen.getByText("dfs-bfs-graphs.pdf")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("1.5 MB")).toBeInTheDocument();
  });

  it("renders link pointing to resource detail page", () => {
    render(<ResourceCard resource={mockResource} />);

    const detailLinks = screen.getAllByRole("link", { name: /View Details/i });
    expect(detailLinks[0]).toHaveAttribute("href", "/resources/res-uuid-101");

    const titleLink = screen.getByRole("link", {
      name: "Graph Algorithms — DFS and BFS",
    });
    expect(titleLink).toHaveAttribute("href", "/resources/res-uuid-101");
  });

  it("renders open action link with target _blank pointing to fileUrl", () => {
    render(<ResourceCard resource={mockResource} />);

    const openLink = screen.getByTitle("Download or open resource file in new tab");
    expect(openLink).toHaveAttribute(
      "href",
      "https://campusos.dev/uploads/resources/dfs-bfs-graphs.pdf",
    );
    expect(openLink).toHaveAttribute("target", "_blank");
    expect(openLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders disabled button when fileUrl is empty", () => {
    const withoutUrl: ResourceItem = {
      ...mockResource,
      fileUrl: "",
    };

    render(<ResourceCard resource={withoutUrl} />);

    expect(screen.getByText("Unavailable")).toBeDisabled();
  });
});
