import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { initials, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Students" };

export default async function TeacherStudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("student_id, status, session_date, category:categories(name), student:users!bookings_student_id_fkey(id, full_name, avatar_url)")
    .eq("teacher_id", user.id)
    .order("session_date", { ascending: false });

  // Deduplicate by student_id, keeping last booking info
  const studentMap = new Map<string, NonNullable<typeof bookings>[number]>();
  for (const booking of bookings ?? []) {
    if (!studentMap.has(booking.student_id)) {
      studentMap.set(booking.student_id, booking);
    }
  }
  const uniqueStudents = Array.from(studentMap.values());

  const completedCountMap = new Map<string, number>();
  for (const booking of bookings ?? []) {
    if (booking.status === "completed") {
      completedCountMap.set(booking.student_id, (completedCountMap.get(booking.student_id) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">My Students</h1>
        <p className="text-muted-foreground">{uniqueStudents.length} unique student{uniqueStudents.length !== 1 ? "s" : ""}</p>
      </div>

      {uniqueStudents.length === 0 ? (
        <EmptyState icon={Users} title="No students yet" description="When students book sessions with you, they'll appear here." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {uniqueStudents.map((booking) => {
            const student = booking.student as { id: string; full_name: string | null; avatar_url: string | null } | null;
            const completed = completedCountMap.get(booking.student_id) ?? 0;
            return (
              <Card key={booking.student_id}>
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {initials(student?.full_name ?? "S")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{student?.full_name ?? "Student"}</p>
                    <p className="text-xs text-muted-foreground">
                      {(booking.category as { name: string } | null)?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{completed} session{completed !== 1 ? "s" : ""}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Last: {formatDate(booking.session_date)}
                      </span>
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
