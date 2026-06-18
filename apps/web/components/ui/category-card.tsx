import Link from "next/link";
import { cn } from "@/lib/utils";
import { SUBJECT_COLORS } from "@myskillora/types";
import type { Category } from "@myskillora/types";

interface CategoryCardProps {
  category: Category;
  teacherCount?: number;
  size?: "sm" | "md" | "lg";
}

const CATEGORY_ICONS: Record<string, string> = {
  english: "📚",
  maths: "📐",
  science: "🔬",
  tamil: "🅣",
  hindi: "🇮🇳",
  "social-studies": "🌍",
  physics: "⚡",
  chemistry: "🧪",
  biology: "🌱",
  "computer-science": "💻",
  music: "🎵",
  orchestra: "🎻",
  "martial-arts": "🥋",
  dance: "💃",
  art: "🎨",
  coding: "⌨️",
  yoga: "🧘",
  chess: "♟️",
  cooking: "👨‍🍳",
  photography: "📷",
  "public-speaking": "🎤",
  sports: "⚽",
  "interview-prep": "💼",
  "ielts-toefl": "🗣️",
  "cat-gmat-gre": "📊",
  "jee-neet": "🏆",
  "data-science": "🤖",
};

export function CategoryCard({ category, teacherCount, size = "md" }: CategoryCardProps) {
  const color = SUBJECT_COLORS[category.slug] ?? SUBJECT_COLORS["default"];
  const icon = CATEGORY_ICONS[category.slug] ?? "📖";

  return (
    <Link href={`/categories/${category.slug}`}>
      <div
        className={cn(
          "group relative overflow-hidden rounded-card border transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer",
          size === "sm" ? "p-3" : size === "lg" ? "p-6" : "p-4"
        )}
        style={{ borderLeftColor: color, borderLeftWidth: 4 }}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center rounded-lg shrink-0",
              size === "sm" ? "h-8 w-8 text-lg" : "h-12 w-12 text-2xl"
            )}
            style={{ backgroundColor: `${color}15` }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "font-heading font-semibold truncate",
                size === "sm" ? "text-sm" : "text-base"
              )}
              style={{ color }}
            >
              {category.name}
            </p>
            {teacherCount != null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {teacherCount} teacher{teacherCount !== 1 ? "s" : ""}
              </p>
            )}
            {category.description && size === "lg" && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
