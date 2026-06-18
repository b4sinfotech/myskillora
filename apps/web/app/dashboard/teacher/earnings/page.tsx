import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { formatCurrencyRaw, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Earnings" };

export default async function TeacherEarningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [completedBookingsRes, payoutsRes, profileRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("teacher_payout, session_date, created_at, student:users!bookings_student_id_fkey(full_name), category:categories(name)")
      .eq("teacher_id", user.id)
      .eq("status", "completed")
      .order("session_date", { ascending: false }),
    supabase
      .from("payouts")
      .select("*")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("teacher_profiles")
      .select("commission_rate, tier")
      .eq("user_id", user.id)
      .single(),
  ]);

  const completedBookings = completedBookingsRes.data ?? [];
  const payouts = payoutsRes.data ?? [];
  const profile = profileRes.data;

  const totalEarned = completedBookings.reduce((sum, b) => sum + b.teacher_payout, 0);
  const totalPaidOut = payouts.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0);
  const pendingPayout = payouts.filter((p) => ["pending", "processing"].includes(p.status)).reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Earnings</h1>
        <p className="text-muted-foreground">
          {profile && `${profile.tier} tier — ${(profile.commission_rate * 100).toFixed(0)}% platform fee`}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Earned" value={formatCurrencyRaw(totalEarned)} icon={DollarSign} iconColor="text-success" />
        <StatCard title="Total Paid Out" value={formatCurrencyRaw(totalPaidOut)} icon={CheckCircle} iconColor="text-info" />
        <StatCard title="Pending Payout" value={formatCurrencyRaw(pendingPayout)} icon={Clock} iconColor="text-amber-500" />
        <StatCard title="Sessions" value={completedBookings.length} icon={TrendingUp} iconColor="text-primary" />
      </div>

      {/* Session Earnings */}
      <Card>
        <CardHeader><CardTitle>Session Earnings</CardTitle></CardHeader>
        <CardContent>
          {completedBookings.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No completed sessions yet.</p>
          ) : (
            <div className="space-y-3">
              {completedBookings.map((booking, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">
                      {(booking.student as { full_name: string | null } | null)?.full_name ?? "Student"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(booking.category as { name: string } | null)?.name} • {formatDate(booking.session_date)}
                    </p>
                  </div>
                  <p className="font-heading font-bold text-success">{formatCurrencyRaw(booking.teacher_payout)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader><CardTitle>Payout History</CardTitle></CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No payouts processed yet.</p>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{formatCurrencyRaw(payout.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(payout.period_start)} — {formatDate(payout.period_end)}
                    </p>
                  </div>
                  <Badge variant={payout.status === "completed" ? "success" : payout.status === "failed" ? "destructive" : "amber"}>
                    {payout.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
