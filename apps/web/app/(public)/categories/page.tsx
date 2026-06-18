import { createClient } from "@/lib/supabase/server";
import { CategoryCard } from "@/components/ui/category-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Subjects & Skills",
  description: "Browse all academic subjects and activity skills available on myskillora.",
};

export default async function CategoriesPage() {
  const supabase = await createClient();

  const { data: parentCategories } = await supabase
    .from("categories")
    .select("*")
    .is("parent_id", null)
    .eq("is_active", true)
    .order("sort_order");

  const { data: allCategories } = await supabase
    .from("categories")
    .select("*")
    .not("parent_id", "is", null)
    .eq("is_active", true)
    .order("sort_order");

  const grouped = (parentCategories ?? []).map((parent) => ({
    parent,
    children: (allCategories ?? []).filter((c) => c.parent_id === parent.id),
  }));

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-primary mb-2">All Subjects & Skills</h1>
        <p className="text-muted-foreground">
          Find a teacher for any subject or skill you want to master.
        </p>
      </div>

      <div className="space-y-10">
        {grouped.map(({ parent, children }) => (
          <div key={parent.id}>
            <h2 className="font-heading text-xl font-semibold text-primary mb-4">{parent.name}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {children.map((category) => (
                <CategoryCard key={category.id} category={category} size="md" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
