import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Audit Log" };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const page = parseInt(params.page ?? "1", 10);
  const pageSize = 50;

  let query = supabase
    .from("audit_logs")
    .select("*, user:users(full_name, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (params.action) {
    query = query.eq("action", params.action);
  }

  const { data: logs, count } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Audit Log</h1>
        <p className="text-muted-foreground text-sm">Immutable record of all platform actions. {count ?? 0} total entries.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Timestamp</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Action</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Entity</th>
                </tr>
              </thead>
              <tbody>
                {(logs ?? []).map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="py-2 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="py-2 px-4">
                      <p className="text-xs">{(log.user as { full_name: string | null } | null)?.full_name ?? "System"}</p>
                      <p className="text-xs text-muted-foreground">{(log.user as { email: string } | null)?.email}</p>
                    </td>
                    <td className="py-2 px-4">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <p className="text-xs">{log.entity_type}</p>
                      <p className="font-mono text-xs text-muted-foreground">{log.entity_id?.slice(0, 8)}...</p>
                    </td>
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
