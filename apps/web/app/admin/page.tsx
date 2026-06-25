import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, CalendarDays, DollarSign, Star, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalTeachers },
    { count: totalStudents },
    { count: totalBookings },
    { count: pendingApprovals },
    { data: revenueData },
    { data: recentBookings },
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("teacher_profiles").select("id", { count: "exact", head: true }).eq("is_approved", true),
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("teacher_profiles").select("id", { count: "exact", head: true }).eq("is_approved", false),
    supabase.from("payments").select("amount").eq("status", "captured"),
    supabase
      .from("bookings")
      .select("*, student:users!bookings_student_id_fkey(full_name), teacher:users!bookings_teacher_id_fkey(full_name), category:categories(name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const totalRevenue = (revenueData ?? []).reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-primary">Platform Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Users" value={totalUsers ?? 0} icon={Users} iconColor="text-info" />
        <StatCard title="Active Teachers" value={totalTeachers ?? 0} icon={UserCheck} iconColor="text-success" />
        <StatCard title="Students" value={totalStudents ?? 0} icon={Users} iconColor="text-primary" />
        <StatCard title="Bookings" value={totalBookings ?? 0} icon={CalendarDays} iconColor="text-accent" />
        <StatCard title="Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} iconColor="text-success" />
        <StatCard
          title="Pending Approvals"
          value={pendingApprovals ?? 0}
          icon={AlertTriangle}
          iconColor="text-amber-500"
        />
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Student</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Teacher</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Subject</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(recentBookings ?? []).map((booking) => (
                  <tr key={booking.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2 px-3">
                      {(booking.student as { full_name: string | null } | null)?.full_name ?? "—"}
                    </td>
                    <td className="py-2 px-3">
                      {(booking.teacher as { full_name: string | null } | null)?.full_name ?? "—"}
                    </td>
                    <td className="py-2 px-3">
                      {(booking.category as { name: string } | null)?.name ?? "—"}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium ${
                        booking.status === "completed" ? "bg-success/10 text-success" :
                        booking.status === "confirmed" ? "bg-info/10 text-info" :
                        booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                        "bg-error/10 text-error"
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-medium">{formatCurrency(booking.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
