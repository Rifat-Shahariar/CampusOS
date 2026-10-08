import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClubSearch } from "./club-search";

describe("ClubSearch", () => {
  it("renders with initial search value", () => {
    render(<ClubSearch initialSearch="robotics" onSearch={vi.fn()} />);

    const input = screen.getByRole("textbox", { name: "Search clubs" });
    expect(input).toHaveValue("robotics");
  });

  it("calls onSearch on form submission", () => {
    const handleSearch = vi.fn();
    render(<ClubSearch initialSearch="" onSearch={handleSearch} />);

    const input = screen.getByRole("textbox", { name: "Search clubs" });
    fireEvent.change(input, { target: { value: "programming" } });

    const submitBtn = screen.getByRole("button", { name: "Search" });
    fireEvent.click(submitBtn);

    expect(handleSearch).toHaveBeenCalledWith("programming");
  });

  it("clears search input and triggers empty search on clear button click", () => {
    const handleSearch = vi.fn();
    render(<ClubSearch initialSearch="initial query" onSearch={handleSearch} />);

    const clearBtn = screen.getByRole("button", { name: "Clear search" });
    fireEvent.click(clearBtn);

    const input = screen.getByRole("textbox", { name: "Search clubs" });
    expect(input).toHaveValue("");
    expect(handleSearch).toHaveBeenCalledWith("");
  });
});
