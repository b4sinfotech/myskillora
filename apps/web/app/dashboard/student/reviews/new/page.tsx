"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
const reviewSchema = z.object({
  rating: z.number().int().min(1, "Please select a rating").max(5),
  body: z.string().min(10, "Please write at least 10 characters").max(1000),
});

type ReviewForm = z.infer<typeof reviewSchema>;

function NewReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, body: "" },
  });

  const rating = watch("rating");

  if (!bookingId) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-muted-foreground">No booking specified. Go back and try again.</p>
        <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const onSubmit = async (data: ReviewForm) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("teacher_id, status")
        .eq("id", bookingId)
        .eq("student_id", user.id)
        .single();

      if (bookingError || !booking) throw new Error("Booking not found");
      if (booking.status !== "completed") throw new Error("You can only review completed sessions");

      const { error } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        student_id: user.id,
        teacher_id: booking.teacher_id,
        rating: data.rating,
        body: data.body,
      });

      if (error) throw error;

      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      router.push("/dashboard/student/reviews");
    } catch (err) {
      toast({
        title: "Could not submit review",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Leave a Review</CardTitle>
          <CardDescription>Share your experience with this teacher</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Star rating */}
            <div>
              <Label className="mb-2 block">Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setValue("rating", star, { shouldValidate: true })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= (hoveredStar || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {errors.rating && <p className="text-xs text-error mt-1">{errors.rating.message}</p>}
            </div>

            {/* Comment */}
            <div>
              <Label htmlFor="body">Your Review</Label>
              <textarea
                id="body"
                rows={5}
                placeholder="Tell others about your experience with this teacher..."
                className="mt-1 w-full rounded-input border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                {...register("body")}
              />
              {errors.body && <p className="text-xs text-error mt-1">{errors.body.message}</p>}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Review
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewReviewPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto h-96 animate-pulse bg-slate-100 rounded-card" />}>
      <NewReviewContent />
    </Suspense>
  );
}
