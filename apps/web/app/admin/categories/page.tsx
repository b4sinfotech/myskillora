import { createClient } from "@/lib/supabase/server";
import { CategoryManagement } from "@/components/admin/CategoryManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Categories" };

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-primary">Categories</h1>
      <CategoryManagement categories={categories ?? []} />
    </div>
  );
}
