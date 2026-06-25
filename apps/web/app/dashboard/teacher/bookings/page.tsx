import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Bookings" };

const STATUS_TABS = ["all", "pending", "confirmed", "completed", "cancelled"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const STATUS_BADGE: Record<string, "default" | "secondary" | "success" | "destructive" | "amber"> = {
  pending: "amber",
  confirmed: "success",
  completed: "default",
  cancelled: "destructive",
  disputed: "destructive",
};

export default async function TeacherBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const activeTab = (params.status as StatusTab) ?? "all";

  let query = supabase
    .from("bookings")
    .select("*, category:categories(name), student:users!bookings_student_id_fkey(id, full_name, avatar_url)")
    .eq("teacher_id", user.id)
    .order("session_date", { ascending: false });

  if (activeTab !== "all") query = query.eq("status", activeTab);

  const { data: bookings } = await query;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-primary">Bookings</h1>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {STATUS_TABS.map((tab) => (
          <Link key={tab} href={`/dashboard/teacher/bookings${tab !== "all" ? `?status=${tab}` : ""}`}>
            <Button variant={activeTab === tab ? "default" : "outline"} size="sm" className="capitalize whitespace-nowrap">
              {tab}
            </Button>
          </Link>
        ))}
      </div>

      {!bookings || bookings.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No bookings found" description="You have no bookings in this category yet." />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">
                        {(booking.student as { full_name: string | null } | null)?.full_name ?? "Student"}
                      </p>
                      <Badge variant={STATUS_BADGE[booking.status] ?? "default"}>{booking.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(booking.category as { name: string } | null)?.name} •{" "}
                      {formatDate(booking.session_date)} at {booking.session_time} • {booking.duration_minutes} min
                    </p>
                    <p className="text-sm font-medium mt-1">
                      Your payout: {formatCurrency(booking.teacher_payout)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {booking.status === "confirmed" && booking.meeting_link && (
                      <a href={booking.meeting_link} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="amber">Join Session</Button>
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
