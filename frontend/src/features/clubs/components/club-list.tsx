"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/spinner";
import { useClubs } from "../hooks/use-clubs";
import { ClubCard } from "./club-card";
import { ClubSearch } from "./club-search";
import { ClubPagination } from "./club-pagination";

export function ClubList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const { clubs, meta, isLoading, error, refetch } = useClubs(search, page);

  const handleSearch = (newSearch: string) => {
    const params = new URLSearchParams();
    if (newSearch) {
      params.set("search", newSearch);
    }
    params.set("page", "1");
    router.push(`/clubs?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/clubs?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Campus Clubs
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Explore and connect with student organizations, technical clubs, and campus societies.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full sm:w-auto">
          <ClubSearch initialSearch={search} onSearch={handleSearch} />
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-16">
          <LoadingState message="Loading campus clubs..." />
        </div>
      ) : error ? (
        <div className="py-8">
          <ErrorState
            title="Failed to Load Clubs"
            message={error}
            onRetry={refetch}
          />
        </div>
      ) : clubs.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={<Users className="size-10 text-muted-foreground" aria-hidden="true" />}
            title={search ? "No matching clubs found" : "No campus clubs available"}
            description={
              search
                ? `No clubs found matching "${search}". Try searching for another name or keyword.`
                : "There are currently no active clubs registered on CampusOS."
            }
            action={
              search ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch("")}
                  className="text-xs cursor-pointer"
                >
                  Clear search filter
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Search Indicator */}
          {search && (
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 px-3.5 py-2 rounded-lg">
              <span>
                Search results for &ldquo;
                <strong className="text-foreground">{search}</strong>&rdquo;
              </span>
              <button
                onClick={() => handleSearch("")}
                className="text-primary hover:underline cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {clubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>

          {/* Pagination */}
          <ClubPagination meta={meta} onPageChange={handlePageChange} />
        </div>
      )}
    </div>
  );
}
