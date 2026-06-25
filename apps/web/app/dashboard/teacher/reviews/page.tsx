import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Star } from "lucide-react";
import { formatRelativeTime, formatRating, initials } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reviews" };

export default async function TeacherReviewsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, student:users!reviews_student_id_fkey(id, full_name, avatar_url)")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Reviews</h1>
          {reviews && reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                  />
                ))}
              </div>
              <span className="font-semibold">{formatRating(avgRating)}</span>
              <span className="text-muted-foreground text-sm">({reviews.length} reviews)</span>
            </div>
          )}
        </div>
      </div>

      {!reviews || reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" description="Complete sessions with students to receive reviews." />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const student = review.student as { full_name: string | null; avatar_url: string | null } | null;
            return (
              <Card key={review.id}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {initials(student?.full_name ?? "S")}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="font-semibold">{student?.full_name ?? "Student"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(review.created_at)}
                          </p>
                        </div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.body && (
                        <p className="mt-2 text-sm text-muted-foreground">{review.body}</p>
                      )}
                      {review.teacher_response && (
                        <div className="mt-3 pl-4 border-l-2 border-primary/20">
                          <p className="text-xs text-muted-foreground mb-1">Your response:</p>
                          <p className="text-sm">{review.teacher_response}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
