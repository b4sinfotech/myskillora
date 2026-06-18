import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { LayoutDashboard, CalendarDays, Users, MessageSquare, Star, Settings } from "lucide-react";
import type { SidebarItem } from "@/components/layout/DashboardSidebar";

const STUDENT_NAV: SidebarItem[] = [
  { label: "Overview", href: "/dashboard/student", icon: LayoutDashboard },
  { label: "My Teachers", href: "/dashboard/student/teachers", icon: Users },
  { label: "Bookings", href: "/dashboard/student/bookings", icon: CalendarDays },
  { label: "Messages", href: "/dashboard/student/messages", icon: MessageSquare },
  { label: "My Reviews", href: "/dashboard/student/reviews", icon: Star },
  { label: "Settings", href: "/dashboard/student/settings", icon: Settings },
];

export default function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/20">
      <DashboardSidebar items={STUDENT_NAV} title="Student Dashboard" />
      <div className="flex-1 min-w-0">
        <div className="container mx-auto px-4 sm:px-6 py-6 max-w-5xl">
          {children}
        </div>
      </div>
    </div>
  );
}
