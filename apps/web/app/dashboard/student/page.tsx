import { redirect } from "next/navigation";
import { CalendarDays, BookOpen, Star, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate, formatCurrency, formatRelativeTime } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Student Dashboard" };

export default async function StudentOverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [bookingsRes, reviewsRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, category:categories(name), teacher:users!bookings_teacher_id_fkey(full_name)")
      .eq("student_id", user.id)
      .order("session_date", { ascending: false })
      .limit(5),
    supabase
      .from("reviews")
      .select("id")
      .eq("student_id", user.id),
  ]);

  const bookings = bookingsRes.data ?? [];
  const reviewCount = reviewsRes.data?.length ?? 0;

  const upcomingBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending"
  );
  const completedSessions = bookings.filter((b) => b.status === "completed").length;
  const totalSpend = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">My Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s your learning overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Upcoming Sessions"
          value={upcomingBookings.length}
          icon={CalendarDays}
          iconColor="text-info"
        />
        <StatCard
          title="Completed Sessions"
          value={completedSessions}
          icon={BookOpen}
          iconColor="text-success"
        />
        <StatCard
          title="Reviews Given"
          value={reviewCount}
          icon={Star}
          iconColor="text-accent"
        />
        <StatCard
          title="Total Invested"
          value={formatCurrency(totalSpend)}
          icon={Clock}
          iconColor="text-primary"
        />
      </div>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming Sessions</CardTitle>
          <Link href="/dashboard/student/bookings">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm mb-4">No upcoming sessions</p>
              <Link href="/teachers">
                <Button variant="amber" size="sm">Find a Teacher</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">
                      {(booking.teacher as { full_name: string | null } | null)?.full_name ?? "Teacher"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(booking.category as { name: string } | null)?.name} •{" "}
                      {formatDate(booking.session_date)} at {booking.session_time}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={booking.status === "confirmed" ? "success" : "secondary"}>
                      {booking.status}
                    </Badge>
                    {booking.meeting_link && (
                      <a href={booking.meeting_link} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="amber">Join</Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity yet. Book your first session!</p>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-accent shrink-0" />
                  <p className="text-sm flex-1">
                    Session with{" "}
                    <span className="font-medium">
                      {(booking.teacher as { full_name: string | null } | null)?.full_name}
                    </span>{" "}
                    — {(booking.category as { name: string } | null)?.name}
                  </p>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {formatRelativeTime(booking.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
