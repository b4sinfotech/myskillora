"use client";

import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import {
  LayoutDashboard, Users, CalendarDays, DollarSign,
  MessageSquare, Star, Settings, Video, BookOpen, ClipboardList
} from "lucide-react";
import type { SidebarItem } from "@/components/layout/DashboardSidebar";

const TEACHER_NAV: SidebarItem[] = [
  { label: "Overview", href: "/dashboard/teacher", icon: LayoutDashboard },
  { label: "Profile Setup", href: "/dashboard/teacher/onboarding", icon: ClipboardList },
  { label: "My Students", href: "/dashboard/teacher/students", icon: Users },
  { label: "Bookings", href: "/dashboard/teacher/bookings", icon: CalendarDays },
  { label: "Earnings", href: "/dashboard/teacher/earnings", icon: DollarSign },
  { label: "Messages", href: "/dashboard/teacher/messages", icon: MessageSquare },
  { label: "Reviews", href: "/dashboard/teacher/reviews", icon: Star },
  { label: "Settings", href: "/dashboard/teacher/settings", icon: Settings },
];

export default function TeacherDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/20">
      <DashboardSidebar items={TEACHER_NAV} title="Teacher Dashboard" />
      <div className="flex-1 min-w-0">
        <div className="container mx-auto px-4 sm:px-6 py-6 max-w-5xl">
          {children}
        </div>
      </div>
    </div>
  );
}
