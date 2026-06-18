import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeacherApprovalActions } from "@/components/admin/TeacherApprovalActions";
import { formatDate, formatRating } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Teachers" };

export default async function AdminTeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const filter = params.status ?? "pending";

  let query = supabase
    .from("teacher_profiles")
    .select(`
      *,
      user:users!teacher_profiles_user_id_fkey(id, full_name, email, created_at),
      subjects:teacher_subjects(category:categories(name))
    `)
    .order("created_at", { ascending: false });

  if (filter === "pending") {
    query = query.eq("is_approved", false);
  } else if (filter === "approved") {
    query = query.eq("is_approved", true);
  }

  const { data: teachers } = await query;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-primary">Teachers</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["pending", "approved", "all"].map((tab) => (
          <Link key={tab} href={`/admin/teachers?status=${tab}`}>
            <Button variant={filter === tab ? "default" : "outline"} size="sm" className="capitalize">
              {tab}
            </Button>
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        {(teachers ?? []).length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No teachers found.</p>
        ) : (
          (teachers ?? []).map((teacher) => (
            <Card key={teacher.id}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">
                        {(teacher.user as { full_name: string | null } | null)?.full_name}
                      </p>
                      <Badge variant={teacher.is_approved ? "success" : "amber"}>
                        {teacher.is_approved ? "Approved" : "Pending"}
                      </Badge>
                      <Badge variant={teacher.tier}>{teacher.tier}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(teacher.user as { email: string } | null)?.email} •{" "}
                      Joined {formatDate((teacher.user as { created_at: string } | null)?.created_at ?? "")}
                    </p>
                    {teacher.headline && (
                      <p className="text-sm mt-1 text-muted-foreground line-clamp-1">{teacher.headline}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {((teacher.subjects ?? []) as { category: { name: string } }[]).map((s, i) => (
                        <span key={i} className="text-xs bg-muted rounded-pill px-2 py-0.5">
                          {s.category?.name}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ⭐ {formatRating(teacher.rating_average)} ({teacher.rating_count} reviews) •{" "}
                      {teacher.total_sessions} sessions
                    </p>
                  </div>
                  <TeacherApprovalActions
                    teacherId={teacher.id}
                    userId={(teacher.user as { id: string } | null)?.id ?? ""}
                    isApproved={teacher.is_approved}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
