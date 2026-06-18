import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, initials, getAvatarUrl } from "@/lib/utils";
import type { ReviewWithStudent } from "@myskillora/types";

interface ReviewCardProps {
  review: ReviewWithStudent;
  showTeacherResponse?: boolean;
}

export function ReviewCard({ review, showTeacherResponse = true }: ReviewCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={getAvatarUrl(review.student.avatar_url, review.student.full_name)} />
            <AvatarFallback className="text-xs">
              {initials(review.student.full_name ?? "S")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{review.student.full_name ?? "Student"}</span>
              {review.is_verified_purchase && (
                <Badge variant="success" className="text-[10px] px-1.5 py-0">Verified</Badge>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {formatRelativeTime(review.created_at)}
              </span>
            </div>

            {/* Star rating */}
            <div className="flex items-center gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < review.rating
                      ? "fill-amber-400 text-amber-400"
                      : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>

            {review.title && (
              <p className="font-semibold text-sm mt-2">{review.title}</p>
            )}
            {review.body && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{review.body}</p>
            )}

            {/* Teacher response */}
            {showTeacherResponse && review.teacher_response && (
              <div className="mt-3 rounded-lg bg-muted p-3 border-l-2 border-accent">
                <p className="text-xs font-semibold text-accent mb-1">Teacher&apos;s Response</p>
                <p className="text-sm text-muted-foreground">{review.teacher_response}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
