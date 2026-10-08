import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClubPostsList } from "./club-posts-list";
import { useClubPosts } from "../hooks/use-club-posts";

vi.mock("../hooks/use-club-posts", () => ({
  useClubPosts: vi.fn(),
}));

describe("ClubPostsList", () => {
  it("renders loading state when isLoading is true", () => {
    vi.mocked(useClubPosts).mockReturnValue({
      posts: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<ClubPostsList clubId="club-1" />);

    expect(screen.getByText("Loading club announcements...")).toBeInTheDocument();
  });

  it("renders error state when error is present", () => {
    vi.mocked(useClubPosts).mockReturnValue({
      posts: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
      isLoading: false,
      error: "Network error loading posts",
      refetch: vi.fn(),
    });

    render(<ClubPostsList clubId="club-1" />);

    expect(screen.getByText("Failed to Load Announcements")).toBeInTheDocument();
    expect(screen.getByText("Network error loading posts")).toBeInTheDocument();
  });

  it("renders empty state when posts array is empty", () => {
    vi.mocked(useClubPosts).mockReturnValue({
      posts: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ClubPostsList clubId="club-1" />);

    expect(screen.getByText("No announcements yet")).toBeInTheDocument();
  });

  it("renders published post cards", () => {
    vi.mocked(useClubPosts).mockReturnValue({
      posts: [
        {
          id: "post-1",
          clubId: "club-1",
          title: "Hackathon Registration is Open",
          content: "Sign up before Friday midnight.",
          coverImageUrl: null,
          isPublished: true,
          publishedAt: "2026-10-01T10:00:00.000Z",
          createdAt: "2026-10-01T10:00:00.000Z",
          updatedAt: "2026-10-01T10:00:00.000Z",
          createdByUser: {
            id: "user-1",
            name: "John Admin",
            avatarUrl: null,
          },
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ClubPostsList clubId="club-1" />);

    expect(screen.getByText("Hackathon Registration is Open")).toBeInTheDocument();
    expect(screen.getByText("Sign up before Friday midnight.")).toBeInTheDocument();
    expect(screen.getByText("John Admin")).toBeInTheDocument();
  });
});
