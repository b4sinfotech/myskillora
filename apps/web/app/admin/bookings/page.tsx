import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bookings — Admin" };

const STATUS_BADGE: Record<string, "default" | "secondary" | "success" | "destructive" | "amber"> = {
  pending: "amber",
  confirmed: "success",
  completed: "default",
  cancelled: "destructive",
  disputed: "destructive",
};

export default async function AdminBookingsPage() {
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, student:users!bookings_student_id_fkey(full_name), teacher:users!bookings_teacher_id_fkey(full_name), category:categories(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">All Bookings</h1>
        <p className="text-muted-foreground">{bookings?.length ?? 0} bookings</p>
      </div>

      {!bookings || bookings.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No bookings yet" description="Bookings will appear here once students book sessions." />
      ) : (
        <Card>
          <CardHeader><CardTitle>Booking Log</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Teacher</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Subject</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 px-3">{(booking.student as { full_name: string | null } | null)?.full_name ?? "—"}</td>
                      <td className="py-2 px-3">{(booking.teacher as { full_name: string | null } | null)?.full_name ?? "—"}</td>
                      <td className="py-2 px-3">{(booking.category as { name: string } | null)?.name ?? "—"}</td>
                      <td className="py-2 px-3">{formatDate(booking.session_date)}</td>
                      <td className="py-2 px-3">
                        <Badge variant={STATUS_BADGE[booking.status] ?? "default"}>{booking.status}</Badge>
                      </td>
                      <td className="py-2 px-3 text-right font-medium">{formatCurrency(booking.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
