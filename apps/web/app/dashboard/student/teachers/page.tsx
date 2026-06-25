import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";
import Link from "next/link";
import { initials, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Teachers" };

export default async function StudentTeachersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("teacher_id, status, session_date, category:categories(name), teacher:users!bookings_teacher_id_fkey(id, full_name, avatar_url), teacher_profile:teacher_profiles!teacher_profiles_user_id_fkey(id, headline, tier)")
    .eq("student_id", user.id)
    .order("session_date", { ascending: false });

  // Deduplicate by teacher_id
  const teacherMap = new Map<string, NonNullable<typeof bookings>[number]>();
  for (const booking of bookings ?? []) {
    if (!teacherMap.has(booking.teacher_id)) {
      teacherMap.set(booking.teacher_id, booking);
    }
  }
  const uniqueTeachers = Array.from(teacherMap.values());

  const sessionCountMap = new Map<string, number>();
  for (const booking of bookings ?? []) {
    if (booking.status === "completed") {
      sessionCountMap.set(booking.teacher_id, (sessionCountMap.get(booking.teacher_id) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">My Teachers</h1>
        <p className="text-muted-foreground">{uniqueTeachers.length} teacher{uniqueTeachers.length !== 1 ? "s" : ""} you&apos;ve booked</p>
      </div>

      {uniqueTeachers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teachers yet"
          description="Book a session to connect with a teacher."
          action={
            <Link href="/teachers">
              <Button variant="amber">Browse Teachers</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {uniqueTeachers.map((booking) => {
            const teacher = booking.teacher as { id: string; full_name: string | null; avatar_url: string | null } | null;
            const tp = booking.teacher_profile as { id: string; headline: string | null; tier: string | null } | null;
            const sessions = sessionCountMap.get(booking.teacher_id) ?? 0;
            return (
              <Card key={booking.teacher_id}>
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {initials(teacher?.full_name ?? "T")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{teacher?.full_name ?? "Teacher"}</p>
                    {tp?.headline && (
                      <p className="text-xs text-muted-foreground truncate">{tp.headline}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {tp?.tier && <Badge variant={tp.tier as "bronze" | "silver" | "gold" | "elite"}>{tp.tier}</Badge>}
                      <span className="text-xs text-muted-foreground">{sessions} session{sessions !== 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Last: {formatDate(booking.session_date)}</p>
                    {tp?.id && (
                      <Link href={`/teachers/${booking.teacher_id}`} className="mt-2 inline-block">
                        <Button size="sm" variant="outline">View Profile</Button>
                      </Link>
                    )}
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
