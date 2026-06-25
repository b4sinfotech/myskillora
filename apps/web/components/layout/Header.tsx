"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, Bell, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { cn, initials, getAvatarUrl } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Find Teachers", href: "/teachers" },
  { label: "Subjects", href: "/categories" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const dashboardHref =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "teacher"
      ? "/dashboard/teacher"
      : "/dashboard/student";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-sm dark:bg-primary/95">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-4 w-4 text-accent" />
            </div>
            <span className="font-heading text-xl font-bold text-primary dark:text-white">
              my<span className="text-accent">skillora</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-accent",
                  pathname === link.href
                    ? "text-accent"
                    : "text-muted-foreground dark:text-gray-300"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Notifications */}
                <Link href={`${dashboardHref}/notifications`} className="relative">
                  <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -right-1 -top-1 h-4 w-4 justify-center rounded-full p-0 text-[10px]"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-pill border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={getAvatarUrl(user.avatar_url, user.full_name)} />
                      <AvatarFallback className="text-xs">
                        {initials(user.full_name ?? user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium max-w-[100px] truncate">
                      {user.full_name?.split(" ")[0] ?? "Account"}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-card border bg-white shadow-card-hover dark:bg-gray-900">
                      <div className="p-2">
                        <Link
                          href={dashboardHref}
                          className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          href={`${dashboardHref}/settings`}
                          className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Settings
                        </Link>
                        <hr className="my-1" />
                        <button
                          onClick={async () => {
                            setUserMenuOpen(false);
                            await signOut();
                            router.push("/");
                          }}
                          className="block w-full rounded-md px-3 py-2 text-sm text-left text-error hover:bg-error/10"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="amber">Get started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white dark:bg-primary px-4 py-4 space-y-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <hr className="my-2" />
          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="block py-2 text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await signOut();
                  router.push("/");
                }}
                className="block w-full text-left py-2 text-sm text-error"
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">Sign in</Button>
              </Link>
              <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="amber" className="w-full">Get started</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
