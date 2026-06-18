import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { TeacherCard } from "@/components/teacher/TeacherCard";
import { TeacherFilters } from "@/components/teacher/TeacherFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";
import type { TeacherWithDetails } from "@myskillora/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Teachers",
  description: "Find expert teachers for every subject and skill on myskillora.",
};

interface SearchParams {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  city?: string;
  tier?: string;
  search?: string;
  page?: string;
  sort?: string;
}

async function TeachersList({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const page = parseInt(searchParams.page ?? "1", 10);
  const pageSize = 12;

  let query = supabase
    .from("teacher_profiles")
    .select(`
      *,
      user:users!teacher_profiles_user_id_fkey(id, full_name, avatar_url, email),
      profile:profiles!profiles_user_id_fkey(city, country),
      subjects:teacher_subjects(
        *,
        category:categories(*)
      ),
      fees:teacher_fees(*),
      videos:sample_videos(*)
    `, { count: "exact" })
    .eq("is_approved", true)
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (searchParams.minRating) {
    query = query.gte("rating_average", parseFloat(searchParams.minRating));
  }
  if (searchParams.tier) {
    query = query.eq("tier", searchParams.tier);
  }
  if (searchParams.sort === "rating") {
    query = query.order("rating_average", { ascending: false });
  } else if (searchParams.sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("is_featured", { ascending: false }).order("rating_average", { ascending: false });
  }

  const { data: teachers, count } = await query;

  if (!teachers || teachers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No teachers found"
        description="Try adjusting your filters to find more teachers."
      />
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">{count ?? 0} teachers found</p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {teachers.map((teacher) => (
          <TeacherCard key={teacher.id} teacher={teacher as unknown as TeacherWithDetails} />
        ))}
      </div>
    </div>
  );
}

function TeachersListSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-card border p-5 space-y-3">
          <div className="flex gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-1">
                <Skeleton className="h-5 w-16 rounded-pill" />
                <Skeleton className="h-5 w-16 rounded-pill" />
              </div>
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-primary mb-2">Find a Teacher</h1>
        <p className="text-muted-foreground">
          Browse expert teachers across all subjects and skills.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:w-64 shrink-0">
          <TeacherFilters />
        </aside>

        {/* Teacher Grid */}
        <div className="flex-1 min-w-0">
          <Suspense fallback={<TeachersListSkeleton />}>
            <TeachersList searchParams={params} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
