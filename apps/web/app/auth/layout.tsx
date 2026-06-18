import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
      <div className="container mx-auto px-4 py-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-5 w-5 text-accent" />
            </div>
            <span className="font-heading text-2xl font-bold text-primary">
              my<span className="text-accent">skillora</span>
            </span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
