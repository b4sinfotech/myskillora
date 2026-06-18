import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeacherOnboardingWizard } from "@/components/teacher/TeacherOnboardingWizard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profile Setup" };

export default async function TeacherOnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [profileRes, subjectsRes, feesRes, videosRes, availabilityRes, categoriesRes] =
    await Promise.all([
      supabase.from("teacher_profiles").select("*").eq("user_id", user.id).single(),
      supabase
        .from("teacher_subjects")
        .select("*, category:categories(*)")
        .eq("teacher_id", user.id),
      supabase.from("teacher_fees").select("*").eq("teacher_id", user.id),
      supabase.from("sample_videos").select("*").eq("teacher_id", user.id),
      supabase.from("teacher_availability").select("*").eq("teacher_id", user.id),
      supabase
        .from("categories")
        .select("*")
        .not("parent_id", "is", null)
        .eq("is_active", true)
        .order("sort_order"),
    ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-primary">Profile Setup</h1>
        <p className="text-muted-foreground">
          Complete all steps to get approved and start teaching.
        </p>
      </div>
      <TeacherOnboardingWizard
        teacherProfile={profileRes.data}
        subjects={subjectsRes.data ?? []}
        fees={feesRes.data ?? []}
        videos={videosRes.data ?? []}
        availability={availabilityRes.data ?? []}
        categories={categoriesRes.data ?? []}
        userId={user.id}
      />
    </div>
  );
}
