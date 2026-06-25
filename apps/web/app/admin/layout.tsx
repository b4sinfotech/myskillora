"use client";

import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import {
  LayoutDashboard, Users, UserCheck, CalendarDays, DollarSign,
  BookOpen, Star, Settings, FileText
} from "lucide-react";
import type { SidebarItem } from "@/components/layout/DashboardSidebar";

const ADMIN_NAV: SidebarItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Teachers", href: "/admin/teachers", icon: UserCheck },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarDays },
  { label: "Payments", href: "/admin/payments", icon: DollarSign },
  { label: "Categories", href: "/admin/categories", icon: BookOpen },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Audit Log", href: "/admin/audit", icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/20">
      <DashboardSidebar items={ADMIN_NAV} title="Admin Panel" subtitle="myskillora" />
      <div className="flex-1 min-w-0">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
