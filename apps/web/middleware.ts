import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@myskillora/types/database";

const PUBLIC_ROUTES = [
  "/",
  "/teachers",
  "/categories",
  "/auth/login",
  "/auth/signup",
  "/auth/verify",
  "/auth/forgot-password",
  "/auth/callback",
];

const STUDENT_ROUTES = ["/dashboard/student"];
const TEACHER_ROUTES = ["/dashboard/teacher"];
const ADMIN_ROUTES = ["/admin"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  ) || pathname.startsWith("/teachers/") || pathname.startsWith("/categories/");
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Unauthenticated user hitting a protected route
  if (!user && !isPublicRoute(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user hitting auth pages — redirect to their dashboard
  if (user && (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup"))) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = userData?.role ?? "student";
    const dashboardUrl = request.nextUrl.clone();

    if (role === "admin") {
      dashboardUrl.pathname = "/admin";
    } else if (role === "teacher") {
      dashboardUrl.pathname = "/dashboard/teacher";
    } else {
      dashboardUrl.pathname = "/dashboard/student";
    }

    return NextResponse.redirect(dashboardUrl);
  }

  // Role-based route protection
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = userData?.role ?? "student";

    const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
    const isTeacherRoute = TEACHER_ROUTES.some((r) => pathname.startsWith(r));
    const isStudentRoute = STUDENT_ROUTES.some((r) => pathname.startsWith(r));

    if (isAdminRoute && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (isTeacherRoute && role !== "teacher" && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (isStudentRoute && role !== "student" && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
