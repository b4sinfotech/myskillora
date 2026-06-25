import { notFound } from "next/navigation";
import { Star, MapPin, Clock, Users, CheckCircle, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewCard } from "@/components/ui/review-card";
import { BookingCard } from "@/components/booking/BookingCard";
import { formatRating, initials, getAvatarUrl } from "@/lib/utils";
import { SUBJECT_COLORS } from "@myskillora/types";
import type { TeacherWithDetails, ReviewWithStudent, Category, TeacherAvailability } from "@myskillora/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const teacherId = slug.split("-").pop();
  if (!teacherId) return { title: "Teacher Profile" };

  const supabase = await createClient();
  const { data } = await supabase
    .from("teacher_profiles")
    .select("headline, user:users(full_name)")
    .eq("id", teacherId)
    .single();

  const name = (data?.user as { full_name: string | null } | null)?.full_name;
  return {
    title: name ? `${name} — Teacher Profile` : "Teacher Profile",
    description: data?.headline ?? undefined,
  };
}

export default async function TeacherProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const teacherId = slug.split("-").pop();
  if (!teacherId) notFound();

  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teacher_profiles")
    .select(`
      *,
      user:users!teacher_profiles_user_id_fkey(id, full_name, avatar_url, email),
      profile:profiles!profiles_user_id_fkey(bio, city, state, country),
      subjects:teacher_subjects(*, category:categories(*)),
      fees:teacher_fees(*),
      videos:sample_videos(*),
      availability:teacher_availability(*)
    `)
    .eq("id", teacherId)
    .eq("is_approved", true)
    .single();

  if (!teacher) notFound();

  const { data: reviews } = await supabase
    .from("reviews")
    .select(`*, student:users!reviews_student_id_fkey(id, full_name, avatar_url)`)
    .eq("teacher_id", teacher.user_id)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(10);

  const t = teacher as unknown as TeacherWithDetails;
  const reviewList = (reviews ?? []) as ReviewWithStudent[];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Left Column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 shrink-0">
                  <AvatarImage
                    src={getAvatarUrl(t.user?.avatar_url ?? null, t.user?.full_name ?? null)}
                    alt={t.user?.full_name ?? "Teacher"}
                  />
                  <AvatarFallback className="text-2xl font-bold bg-primary text-white">
                    {initials(t.user?.full_name ?? "T")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="font-heading text-2xl font-bold text-primary">
                      {t.user?.full_name}
                    </h1>
                    <Badge variant={t.tier}>{t.tier}</Badge>
                    {t.is_featured && <Badge variant="amber">Featured</Badge>}
                  </div>
                  {t.headline && (
                    <p className="text-muted-foreground mb-3">{t.headline}</p>
                  )}

                  {/* Subjects */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {t.subjects.map((s) => (
                      <span
                        key={s.id}
                        className="text-xs px-2.5 py-1 rounded-pill font-medium text-white"
                        style={{
                          backgroundColor: SUBJECT_COLORS[s.category?.slug ?? ""] ?? SUBJECT_COLORS["default"],
                        }}
                      >
                        {s.category?.name}
                      </span>
                    ))}
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-foreground">
                        {formatRating(t.rating_average)}
                      </span>
                      <span>({t.rating_count} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {t.total_students} students
                    </div>
                    {t.experience_years != null && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {t.experience_years} years experience
                      </div>
                    )}
                    {(t.profile as { city?: string; country?: string } | null)?.city && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {(t.profile as { city?: string; country?: string }).city}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          {t.full_bio && (
            <Card>
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: t.full_bio }}
                />
              </CardContent>
            </Card>
          )}

          {/* Sample Videos */}
          {t.videos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sample Lessons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {t.videos.filter((v) => v.is_active).map((video) => (
                    <a
                      key={video.id}
                      href={video.cloudinary_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative overflow-hidden rounded-card border aspect-video bg-muted flex items-center justify-center hover:border-accent transition-colors"
                    >
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-primary/10" />
                      )}
                      <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="h-5 w-5 text-primary fill-primary" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-3">
                        <p className="text-white text-sm font-medium line-clamp-1">{video.title}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Reviews ({t.rating_count})</CardTitle>
            </CardHeader>
            <CardContent>
              {reviewList.length === 0 ? (
                <p className="text-muted-foreground text-sm">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviewList.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column — Booking Card ──────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-heading font-bold text-xl text-primary mb-4">Book a Session</h3>
                <BookingCard
                  teacherUserId={t.user_id}
                  teacherName={t.user?.full_name ?? "Teacher"}
                  teacherAvatarUrl={t.user?.avatar_url ?? null}
                  fees={t.fees}
                  availability={(t as unknown as { availability: TeacherAvailability[] }).availability ?? []}
                  categories={t.subjects.map((s) => s.category as Category).filter(Boolean)}
                />
              </CardContent>
            </Card>

            {/* Qualifications */}
            {Array.isArray(t.qualifications) && t.qualifications.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Qualifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(t.qualifications as string[]).map((q, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">{q}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
