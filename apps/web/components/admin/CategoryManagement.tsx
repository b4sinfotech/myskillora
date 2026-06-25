"use client";

import { useState } from "react";
import { Plus, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Category } from "@myskillora/types";

interface Props {
  categories: Category[];
}

export function CategoryManagement({ categories }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", type: "academic" as "academic" | "activity" | "professional", parentId: "" });

  const parents = categories.filter((c) => !c.parent_id);
  const children = categories.filter((c) => c.parent_id);

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveEdit = async (cat: Category) => {
    const { error } = await supabase
      .from("categories")
      .update({ name: editName, slug: editName.toLowerCase().replace(/\s+/g, "-") })
      .eq("id", cat.id);
    if (error) {
      toast({ title: "Error updating", variant: "destructive" });
    } else {
      toast({ title: "Category updated" });
      setEditingId(null);
      router.refresh();
    }
  };

  const toggleActive = async (cat: Category) => {
    await supabase.from("categories").update({ is_active: !cat.is_active }).eq("id", cat.id);
    router.refresh();
  };

  const addCategory = async () => {
    if (!newCat.name) return;
    const { error } = await supabase.from("categories").insert({
      name: newCat.name,
      slug: newCat.name.toLowerCase().replace(/\s+/g, "-"),
      type: newCat.type,
      parent_id: newCat.parentId || null,
      is_active: true,
      sort_order: categories.length + 1,
    });
    if (error) {
      toast({ title: "Error adding category", variant: "destructive" });
    } else {
      toast({ title: "Category added!" });
      setShowAddForm(false);
      setNewCat({ name: "", type: "academic", parentId: "" });
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowAddForm(!showAddForm)} variant="amber">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Category</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Input
                  placeholder="Category name"
                  value={newCat.name}
                  onChange={(e) => setNewCat((c) => ({ ...c, name: e.target.value }))}
                />
              </div>
              <div>
                <select
                  className="w-full rounded-input border border-input px-3 py-2 text-sm"
                  value={newCat.type}
                  onChange={(e) => setNewCat((c) => ({ ...c, type: e.target.value as typeof c.type }))}
                >
                  <option value="academic">Academic</option>
                  <option value="activity">Activity</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
              <div>
                <select
                  className="w-full rounded-input border border-input px-3 py-2 text-sm"
                  value={newCat.parentId}
                  onChange={(e) => setNewCat((c) => ({ ...c, parentId: e.target.value }))}
                >
                  <option value="">No parent (top-level)</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button size="sm" variant="amber" onClick={addCategory}>Add</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parent categories with children */}
      {parents.map((parent) => (
        <Card key={parent.id}>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={parent.type === "academic" ? "default" : parent.type === "activity" ? "amber" : "secondary"}>
                  {parent.type}
                </Badge>
                <span className="font-semibold">{parent.name}</span>
              </div>
              <button onClick={() => void toggleActive(parent)} className="text-xs text-muted-foreground hover:text-primary">
                {parent.is_active ? "Active" : "Inactive"}
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {children.filter((c) => c.parent_id === parent.id).map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <button onClick={() => void saveEdit(cat)}>
                        <Check className="h-4 w-4 text-success" />
                      </button>
                      <button onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4 text-error" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cat.name}</span>
                        {!cat.is_active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(cat)} className="p-1 hover:text-primary">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => void toggleActive(cat)} className="p-1 hover:text-accent">
                          {cat.is_active ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
