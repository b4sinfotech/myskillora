import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const _next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Redirect to the appropriate dashboard based on role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        const role = userData?.role ?? "student";
        const dashboard =
          role === "admin" ? "/admin" :
          role === "teacher" ? "/dashboard/teacher" :
          "/dashboard/student";

        return NextResponse.redirect(`${origin}${dashboard}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
