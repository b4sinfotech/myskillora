import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface ApprovalRequest {
  teacherId: string;
  action: "approve" | "reject" | "suspend";
  reason?: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: currentUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (currentUser?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json() as ApprovalRequest;
  const { teacherId, action, reason } = body;

  const adminClient = createAdminClient();

  const updates: Record<string, unknown> = {};
  if (action === "approve") {
    updates.is_approved = true;
    updates.is_active = true;
  } else if (action === "reject") {
    updates.is_approved = false;
    updates.is_active = false;
  } else if (action === "suspend") {
    updates.is_active = false;
  }

  const { error } = await adminClient
    .from("teacher_profiles")
    .update(updates)
    .eq("user_id", teacherId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await adminClient.from("audit_logs").insert({
    user_id: user.id,
    action: `teacher_${action}`,
    entity_type: "teacher_profiles",
    entity_id: teacherId,
    metadata: { reason, action },
  });

  return NextResponse.json({ success: true, action });
}
