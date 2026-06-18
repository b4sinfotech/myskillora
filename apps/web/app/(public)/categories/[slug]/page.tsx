import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeacherCard } from "@/components/teacher/TeacherCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";
import { SUBJECT_COLORS } from "@myskillora/types";
import type { TeacherWithDetails } from "@myskillora/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("name, description")
    .eq("slug", slug)
    .single();

  return {
    title: data?.name ? `${data.name} Teachers` : "Category",
    description: data?.description ?? undefined,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!category) notFound();

  const { data: teacherSubjects } = await supabase
    .from("teacher_subjects")
    .select(`
      teacher_id,
      teacher:teacher_profiles(
        *,
        user:users!teacher_profiles_user_id_fkey(id, full_name, avatar_url, email),
        subjects:teacher_subjects(*, category:categories(*)),
        fees:teacher_fees(*),
        videos:sample_videos(*)
      )
    `)
    .eq("category_id", category.id);

  const teachers = (teacherSubjects ?? [])
    .map((ts) => ts.teacher)
    .filter(Boolean)
    .filter((t) => (t as { is_approved: boolean }).is_approved) as unknown as TeacherWithDetails[];

  const color = SUBJECT_COLORS[category.slug] ?? SUBJECT_COLORS["default"];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Category Header */}
      <div className="mb-8 flex items-start gap-4">
        <div
          className="h-16 w-16 rounded-card flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          📚
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold mb-1" style={{ color }}>
            {category.name}
          </h1>
          {category.description && (
            <p className="text-muted-foreground max-w-2xl">{category.description}</p>
          )}
          <p className="text-sm font-medium mt-2" style={{ color }}>
            {teachers.length} teacher{teachers.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>

      {teachers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teachers yet"
          description="Be the first to teach this subject on myskillora!"
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {teachers.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </div>
      )}
    </div>
  );
}
