import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Star } from "lucide-react";
import { formatDate, formatRating } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Reviews" };

export default async function StudentReviewsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      *,
      teacher:users!reviews_teacher_id_fkey(full_name),
      booking:bookings(category:categories(name))
    `)
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-primary">My Reviews</h1>
      {!reviews || reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="Complete a session to leave a review for your teacher."
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {(review.teacher as { full_name: string | null } | null)?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {((review.booking as { category?: { name: string } } | null)?.category)?.name} •{" "}
                      {formatDate(review.created_at)}
                    </p>
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                        />
                      ))}
                    </div>
                    {review.body && <p className="text-sm text-muted-foreground mt-1">{review.body}</p>}
                  </div>
                  <span className="font-heading font-bold text-xl text-accent shrink-0">
                    {formatRating(review.rating)}
                  </span>
                </div>
                {review.teacher_response && (
                  <div className="mt-3 rounded-lg bg-muted p-3 border-l-2 border-accent">
                    <p className="text-xs font-semibold text-accent mb-1">Teacher&apos;s Response</p>
                    <p className="text-sm text-muted-foreground">{review.teacher_response}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
