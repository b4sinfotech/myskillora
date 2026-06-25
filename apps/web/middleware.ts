import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

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
  const { supabase, response: supabaseResponse } = createMiddlewareClient(request);

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Unauthenticated user hitting a protected route
  if (!user && !isPublicRoute(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user — fetch role once for all role-based decisions
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = userData?.role ?? "student";

    // Redirect away from auth pages
    if (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup")) {
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
