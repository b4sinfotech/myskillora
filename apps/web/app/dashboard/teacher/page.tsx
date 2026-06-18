import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DollarSign, Users, Star, CalendarDays, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrencyRaw, formatDate, formatRating } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Teacher Dashboard" };

export default async function TeacherOverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [profileRes, bookingsRes, payoutsRes] = await Promise.all([
    supabase
      .from("teacher_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("bookings")
      .select("*, student:users!bookings_student_id_fkey(full_name), category:categories(name)")
      .eq("teacher_id", user.id)
      .in("status", ["pending", "confirmed"])
      .order("session_date")
      .limit(5),
    supabase
      .from("payouts")
      .select("amount, status")
      .eq("teacher_id", user.id),
  ]);

  const profile = profileRes.data;
  const upcomingBookings = bookingsRes.data ?? [];
  const payouts = payoutsRes.data ?? [];

  const totalEarned = payouts
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayout = payouts
    .filter((p) => p.status === "pending" || p.status === "processing")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your teaching business</p>
        </div>
        {profile && !profile.is_approved && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Your profile is pending approval. Complete your profile to speed up the process.
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Earned"
          value={formatCurrencyRaw(totalEarned)}
          icon={DollarSign}
          iconColor="text-success"
        />
        <StatCard
          title="Pending Payout"
          value={formatCurrencyRaw(pendingPayout)}
          icon={TrendingUp}
          iconColor="text-amber-500"
        />
        <StatCard
          title="Total Students"
          value={profile?.total_students ?? 0}
          icon={Users}
          iconColor="text-info"
        />
        <StatCard
          title="Rating"
          value={profile ? formatRating(profile.rating_average) : "—"}
          subtitle={`${profile?.rating_count ?? 0} reviews`}
          icon={Star}
          iconColor="text-accent"
        />
      </div>

      {/* Profile Status */}
      {profile && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-semibold mb-1">Profile Status</p>
                <div className="flex items-center gap-2">
                  <Badge variant={profile.is_approved ? "success" : "amber"}>
                    {profile.is_approved ? "Approved" : "Pending Review"}
                  </Badge>
                  <Badge variant={profile.tier}>{profile.tier} Tier</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {profile.total_sessions} sessions completed • {(profile.commission_rate * 100).toFixed(0)}% platform fee
                </p>
              </div>
              <Link href="/dashboard/teacher/onboarding">
                <Button variant="outline" size="sm">
                  {profile.is_approved ? "Edit Profile" : "Complete Profile"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming Sessions</CardTitle>
          <Link href="/dashboard/teacher/bookings">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">
              No upcoming sessions. Share your profile to attract students!
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">
                      {(booking.student as { full_name: string | null } | null)?.full_name ?? "Student"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(booking.category as { name: string } | null)?.name} •{" "}
                      {formatDate(booking.session_date)} at {booking.session_time}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={booking.status === "confirmed" ? "success" : "amber"}>
                      {booking.status}
                    </Badge>
                    <p className="text-sm font-semibold">{formatCurrencyRaw(booking.teacher_payout)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
