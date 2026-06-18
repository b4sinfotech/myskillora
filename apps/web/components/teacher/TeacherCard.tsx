import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatCurrencyRaw, formatRating, initials, getAvatarUrl } from "@/lib/utils";
import { SUBJECT_COLORS } from "@myskillora/types";
import type { TeacherWithDetails } from "@myskillora/types";

interface TeacherCardProps {
  teacher: TeacherWithDetails;
  compact?: boolean;
}

export function TeacherCard({ teacher, compact = false }: TeacherCardProps) {
  const primarySubject = teacher.subjects.find((s) => s.is_primary) ?? teacher.subjects[0];
  const subjectColor = primarySubject
    ? (SUBJECT_COLORS[primarySubject.category.slug] ?? SUBJECT_COLORS["default"])
    : SUBJECT_COLORS["default"];

  const lowestFee = teacher.fees.length > 0
    ? Math.min(...teacher.fees.map((f) => f.amount))
    : null;

  const slug = teacher.user.full_name
    ? `${teacher.user.full_name.toLowerCase().replace(/\s+/g, "-")}-${teacher.id.slice(0, 8)}`
    : teacher.id;

  return (
    <Card className="group overflow-hidden hover:shadow-card-hover transition-shadow duration-200">
      {/* Subject accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: subjectColor }} />

      <CardContent className={compact ? "p-4" : "p-5"}>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Link href={`/teachers/${slug}`} className="shrink-0">
            <Avatar className={compact ? "h-12 w-12" : "h-16 w-16"}>
              <AvatarImage
                src={getAvatarUrl(teacher.user.avatar_url, teacher.user.full_name)}
                alt={teacher.user.full_name ?? "Teacher"}
              />
              <AvatarFallback className="text-base font-semibold bg-primary text-white">
                {initials(teacher.user.full_name ?? "T")}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            {/* Name & tier */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/teachers/${slug}`}
                className="font-heading font-semibold text-primary hover:text-accent transition-colors line-clamp-1"
              >
                {teacher.user.full_name ?? "Teacher"}
              </Link>
              <Badge variant={teacher.tier}>{teacher.tier}</Badge>
              {teacher.is_featured && (
                <Badge variant="amber">Featured</Badge>
              )}
            </div>

            {/* Headline */}
            {teacher.headline && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {teacher.headline}
              </p>
            )}

            {/* Subjects */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {teacher.subjects.slice(0, 3).map((s) => (
                <span
                  key={s.id}
                  className="text-xs px-2 py-0.5 rounded-pill font-medium text-white"
                  style={{ backgroundColor: SUBJECT_COLORS[s.category.slug] ?? SUBJECT_COLORS["default"] }}
                >
                  {s.category.name}
                </span>
              ))}
              {teacher.subjects.length > 3 && (
                <span className="text-xs px-2 py-0.5 rounded-pill bg-muted text-muted-foreground">
                  +{teacher.subjects.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>

        {!compact && (
          <>
            {/* Stats row */}
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground">{formatRating(teacher.rating_average)}</span>
                <span>({teacher.rating_count})</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{teacher.total_students} students</span>
              </div>
              {teacher.experience_years != null && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{teacher.experience_years}y exp.</span>
                </div>
              )}
            </div>

            {/* Price & CTA */}
            <div className="flex items-center justify-between mt-4">
              <div>
                {lowestFee != null ? (
                  <div>
                    <span className="text-xs text-muted-foreground">Starting from</span>
                    <p className="font-heading font-bold text-lg text-primary">
                      {formatCurrencyRaw(lowestFee)}<span className="text-sm font-normal text-muted-foreground">/hr</span>
                    </p>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Contact for pricing</span>
                )}
              </div>
              <Link href={`/teachers/${slug}`}>
                <Button size="sm" variant="amber">View Profile</Button>
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
