import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";
import { formatDate, initials } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Students — Admin" };

export default async function AdminStudentsPage() {
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("users")
    .select("*, student_profile:students(grade_level, school_name, learning_goals)")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Students</h1>
        <p className="text-muted-foreground">{students?.length ?? 0} registered students</p>
      </div>

      {!students || students.length === 0 ? (
        <EmptyState icon={Users} title="No students yet" description="Students will appear here once they register." />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Grade</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const sp = student.student_profile as { grade_level: string | null; school_name: string | null } | null;
                    return (
                      <tr key={student.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                              {initials(student.full_name ?? "S")}
                            </div>
                            <span className="font-medium">{student.full_name ?? "—"}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">{student.email}</td>
                        <td className="py-2 px-3">{sp?.grade_level ?? "—"}</td>
                        <td className="py-2 px-3">
                          <Badge variant={student.is_active ? "success" : "destructive"}>
                            {student.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">{formatDate(student.created_at)}</td>
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
