"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EventFiltersProps {
  initialSearch?: string;
  selectedCategory?: string;
  onFilterChange: (filters: { search?: string; eventType?: string }) => void;
}

const CATEGORIES = [
  "All",
  "Workshop",
  "Hackathon",
  "Seminar",
  "Cultural",
  "Competition",
];

export function EventFilters({
  initialSearch = "",
  selectedCategory,
  onFilterChange,
}: EventFiltersProps) {
  const [searchValue, setSearchValue] = useState(initialSearch);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      search: searchValue.trim() || undefined,
      eventType: selectedCategory,
    });
  };

  const handleClear = () => {
    setSearchValue("");
    onFilterChange({
      search: undefined,
      eventType: selectedCategory,
    });
  };

  const handleCategorySelect = (category: string) => {
    const newCategory = category === "All" ? undefined : category;
    onFilterChange({
      search: searchValue.trim() || undefined,
      eventType: newCategory,
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search events by title or keyword..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Button type="submit" size="sm" className="px-4">
          Search
        </Button>
      </form>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-medium text-muted-foreground mr-1">
          Category:
        </span>
        {CATEGORIES.map((cat) => {
          const isSelected =
            (cat === "All" && !selectedCategory) || selectedCategory === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
