"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const RATING_OPTIONS = [
  { label: "4.5+ ⭐⭐⭐⭐⭐", value: "4.5" },
  { label: "4.0+", value: "4.0" },
  { label: "3.5+", value: "3.5" },
];

const TIER_OPTIONS = [
  { label: "Elite", value: "elite" },
  { label: "Gold", value: "gold" },
  { label: "Silver", value: "silver" },
  { label: "Bronze", value: "bronze" },
];

const SORT_OPTIONS = [
  { label: "Best Match", value: "" },
  { label: "Highest Rated", value: "rating" },
  { label: "Newest", value: "newest" },
];

export function TeacherFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/teachers?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = () => router.push("/teachers");

  const hasFilters =
    searchParams.has("minRating") ||
    searchParams.has("tier") ||
    searchParams.has("sort");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Filters</CardTitle>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-error hover:underline"
            >
              <X className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Sort */}
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            Sort By
          </Label>
          <div className="space-y-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter("sort", opt.value)}
                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  (searchParams.get("sort") ?? "") === opt.value
                    ? "bg-primary text-white"
                    : "hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            Minimum Rating
          </Label>
          <div className="space-y-1">
            {RATING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  setFilter(
                    "minRating",
                    searchParams.get("minRating") === opt.value ? "" : opt.value
                  )
                }
                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  searchParams.get("minRating") === opt.value
                    ? "bg-primary text-white"
                    : "hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tier */}
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            Teacher Tier
          </Label>
          <div className="flex flex-wrap gap-2">
            {TIER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  setFilter("tier", searchParams.get("tier") === opt.value ? "" : opt.value)
                }
              >
                <Badge
                  variant={searchParams.get("tier") === opt.value ? (opt.value as "elite" | "gold" | "silver" | "bronze") : "outline"}
                >
                  {opt.label}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
