import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type") ?? "all";
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = 12;
  const offset = (page - 1) * pageSize;

  if (!q || q.length < 2) {
    return NextResponse.json({ teachers: [], categories: [], total: 0 });
  }

  const supabase = await createClient();
  const results: { teachers: unknown[]; categories: unknown[] } = {
    teachers: [],
    categories: [],
  };

  if (type === "all" || type === "teachers") {
    const { data } = await supabase
      .from("teacher_profiles")
      .select(`
        user_id,
        headline,
        rating_average,
        rating_count,
        tier,
        total_sessions,
        user:users!teacher_profiles_user_id_fkey(full_name, avatar_url),
        subjects:teacher_subjects(category:categories(name, slug))
      `)
      .eq("is_approved", true)
      .textSearch("headline", q, { type: "websearch", config: "english" })
      .order("rating_average", { ascending: false })
      .range(offset, offset + pageSize - 1);

    results.teachers = data ?? [];
  }

  if (type === "all" || type === "categories") {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, description, type, icon_url")
      .eq("is_active", true)
      .ilike("name", `%${q}%`)
      .limit(8);

    results.categories = data ?? [];
  }

  return NextResponse.json(results);
}
