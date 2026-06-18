import Link from "next/link";
import { BookOpen } from "lucide-react";

const FOOTER_LINKS = {
  Platform: [
    { label: "Find Teachers", href: "/teachers" },
    { label: "All Subjects", href: "/categories" },
    { label: "How it Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
  ],
  "Teach on myskillora": [
    { label: "Become a Teacher", href: "/auth/signup?role=teacher" },
    { label: "Teacher Resources", href: "/teachers/resources" },
    { label: "Commission Tiers", href: "/teachers/tiers" },
  ],
  Support: [
    { label: "Help Center", href: "/help" },
    { label: "Contact Us", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-primary text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <span className="font-heading text-xl font-bold">
                my<span className="text-accent">skillora</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Connecting passionate learners with expert teachers across India and beyond.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="font-heading font-semibold text-sm mb-4 text-white">{heading}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} myskillora. All rights reserved.
          </p>
          <p className="text-sm text-gray-500">
            Made with care in India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
