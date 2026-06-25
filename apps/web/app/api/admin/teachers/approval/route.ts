import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface ApprovalRequest {
  teacherId: string;
  userId: string;
  action: "approve" | "reject" | "suspend";
  reason?: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: currentUser } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (currentUser?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json() as ApprovalRequest;
  const { teacherId, userId: targetUserId, action, reason } = body;

  const adminClient = createAdminClient();

  if (action === "approve") {
    // Set is_approved on teacher_profiles and activate user
    const { error } = await adminClient
      .from("teacher_profiles")
      .update({ is_approved: true, approved_at: new Date().toISOString(), approved_by: user.id })
      .eq("user_id", targetUserId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await adminClient.from("users").update({ is_active: true }).eq("id", targetUserId);
  } else if (action === "reject") {
    const { error } = await adminClient
      .from("teacher_profiles")
      .update({ is_approved: false })
      .eq("user_id", targetUserId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (action === "suspend") {
    // Suspend deactivates the user account (is_active is on users table, not teacher_profiles)
    const { error } = await adminClient.from("users").update({ is_active: false }).eq("id", targetUserId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await adminClient.from("audit_logs").insert({
    user_id: user.id,
    action: `teacher_${action}`,
    entity_type: "teacher_profiles",
    entity_id: teacherId,
    metadata: { reason, action, target_user_id: targetUserId },
  });

  return NextResponse.json({ success: true, action });
}
