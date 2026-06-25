import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DollarSign } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payments — Admin" };

const STATUS_BADGE: Record<string, "default" | "secondary" | "success" | "destructive" | "amber"> = {
  pending: "amber",
  captured: "success",
  failed: "destructive",
  refunded: "secondary",
};

export default async function AdminPaymentsPage() {
  const supabase = await createClient();

  const [{ data: payments }, { data: revenueRows }] = await Promise.all([
    supabase
      .from("payments")
      .select("*, booking:bookings(student_id, teacher_id, student:users!bookings_student_id_fkey(full_name), teacher:users!bookings_teacher_id_fkey(full_name))")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("payments").select("amount").eq("status", "captured"),
  ]);

  const totalRevenue = (revenueRows ?? []).reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Payments</h1>
          <p className="text-muted-foreground">Total revenue: {formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {!payments || payments.length === 0 ? (
        <EmptyState icon={DollarSign} title="No payments yet" description="Payment records will appear here." />
      ) : (
        <Card>
          <CardHeader><CardTitle>Transaction Log</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Teacher</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Razorpay ID</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const booking = payment.booking as { student: { full_name: string | null } | null; teacher: { full_name: string | null } | null } | null;
                    return (
                      <tr key={payment.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 px-3">{booking?.student?.full_name ?? "—"}</td>
                        <td className="py-2 px-3">{booking?.teacher?.full_name ?? "—"}</td>
                        <td className="py-2 px-3 font-mono text-xs">{payment.razorpay_payment_id ?? payment.razorpay_order_id ?? "—"}</td>
                        <td className="py-2 px-3">{formatDateTime(payment.created_at)}</td>
                        <td className="py-2 px-3">
                          <Badge variant={STATUS_BADGE[payment.status] ?? "default"}>{payment.status}</Badge>
                        </td>
                        <td className="py-2 px-3 text-right font-medium">{formatCurrency(payment.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
