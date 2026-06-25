import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Star } from "lucide-react";
import { formatRelativeTime, initials } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reviews — Admin" };

export default async function AdminReviewsPage() {
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, student:users!reviews_student_id_fkey(full_name), teacher:users!reviews_teacher_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const flagged = (reviews ?? []).filter((r) => r.is_flagged);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Reviews</h1>
        <p className="text-muted-foreground">
          {reviews?.length ?? 0} total • {flagged.length} flagged
        </p>
      </div>

      {!reviews || reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" description="Reviews will appear here once students leave feedback." />
      ) : (
        <Card>
          <CardHeader><CardTitle>All Reviews</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((review) => {
                const student = review.student as { full_name: string | null } | null;
                const teacher = review.teacher as { full_name: string | null } | null;
                return (
                  <div key={review.id} className={`p-4 rounded-lg border ${review.is_flagged ? "border-error/30 bg-error/5" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {initials(student?.full_name ?? "S")}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{student?.full_name ?? "Student"}</span>
                            <span className="text-muted-foreground text-xs">→ {teacher?.full_name ?? "Teacher"}</span>
                          </div>
                          <div className="flex gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                            ))}
                          </div>
                          {review.body && <p className="text-sm text-muted-foreground mt-1">{review.body}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {review.is_flagged && <Badge variant="destructive">Flagged</Badge>}
                        <Badge variant={review.is_published ? "success" : "amber"}>
                          {review.is_published ? "Published" : "Hidden"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(review.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
