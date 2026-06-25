import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Star, BookOpen, Shield, Zap, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "myskillora — Find Expert Teachers for Every Skill",
  description: "Connect with verified teachers for academic subjects, music, sports, and more. Book sessions, learn faster, grow faster.",
};
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Find Your Teacher",
    description: "Browse hundreds of verified teachers across subjects and skills. Filter by price, rating, and availability.",
    icon: BookOpen,
  },
  {
    step: "2",
    title: "Book a Session",
    description: "Choose your preferred time slot and pay securely via Razorpay. Instant confirmation.",
    icon: Shield,
  },
  {
    step: "3",
    title: "Start Learning",
    description: "Join your session via the meeting link. Rate your teacher afterwards.",
    icon: Zap,
  },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    role: "Class 10 Student",
    text: "Found an amazing maths teacher who explained concepts I struggled with for years. My scores went from 60% to 92%!",
    rating: 5,
  },
  {
    name: "Arjun Krishnan",
    role: "Parent",
    text: "myskillora made it so easy to find a qualified Carnatic music teacher near us. Booking and payment were seamless.",
    rating: 5,
  },
  {
    name: "Meera Nair",
    role: "Class 12 Student",
    text: "The chemistry teacher I found here is incredible. She made organic chemistry actually fun and easy to understand.",
    rating: 5,
  },
];

const FEATURED_SUBJECTS = [
  { name: "English", slug: "english", emoji: "📚", color: "#3B82F6" },
  { name: "Mathematics", slug: "maths", emoji: "📐", color: "#8B5CF6" },
  { name: "Science", slug: "science", emoji: "🔬", color: "#10B981" },
  { name: "Tamil", slug: "tamil", emoji: "🅣", color: "#F59E0B" },
  { name: "Music", slug: "music", emoji: "🎵", color: "#EC4899" },
  { name: "Coding", slug: "coding", emoji: "⌨️", color: "#6366F1" },
  { name: "Dance", slug: "dance", emoji: "💃", color: "#F97316" },
  { name: "Martial Arts", slug: "martial-arts", emoji: "🥋", color: "#EF4444" },
];

export default async function HomePage() {
  const supabase = await createClient();

  const { count: teacherCount } = await supabase
    .from("teacher_profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_approved", true);

  const { count: studentCount } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true });

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-navy-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <div className="max-w-3xl">
            <Badge variant="amber" className="mb-4 text-sm px-3 py-1">
              🚀 Now live — 100+ teachers across India
            </Badge>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Learn from the{" "}
              <span className="text-accent">best teachers</span>{" "}
              near you
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
              myskillora connects students with expert teachers for academic subjects, music, arts,
              martial arts, coding, and more. Discover, book, and learn — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/teachers">
                <Button size="xl" variant="amber" className="w-full sm:w-auto">
                  Find a Teacher <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/signup?role=teacher">
                <Button
                  size="xl"
                  variant="outline"
                  className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 hover:text-white"
                >
                  Teach on myskillora
                </Button>
              </Link>
            </div>

            {/* Social proof numbers */}
            <div className="flex flex-wrap gap-8 mt-12 text-sm">
              <div>
                <p className="font-heading font-bold text-2xl text-accent">{teacherCount ?? 0}+</p>
                <p className="text-gray-400">Verified Teachers</p>
              </div>
              <div>
                <p className="font-heading font-bold text-2xl text-accent">{studentCount ?? 0}+</p>
                <p className="text-gray-400">Happy Students</p>
              </div>
              <div>
                <p className="font-heading font-bold text-2xl text-accent">4.9</p>
                <p className="text-gray-400">Average Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Subjects ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-bold text-primary mb-3">
              What do you want to learn?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From school subjects to creative skills — find a teacher for everything.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {FEATURED_SUBJECTS.map((subject) => (
              <Link key={subject.slug} href={`/categories/${subject.slug}`}>
                <div
                  className="group flex flex-col items-center gap-3 p-5 rounded-card border-2 bg-white hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-center"
                  style={{ borderColor: `${subject.color}30` }}
                >
                  <span className="text-3xl">{subject.emoji}</span>
                  <span
                    className="font-heading font-semibold text-sm"
                    style={{ color: subject.color }}
                  >
                    {subject.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/categories">
              <Button variant="outline">
                View all subjects <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-primary mb-3">
              How myskillora works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Start learning in 3 simple steps.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white font-heading font-bold text-xl mx-auto mb-6">
                    {step.step}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-card bg-accent/10 mx-auto mb-4">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl text-primary mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-primary mb-3">
              What students say
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="p-6">
                <CardContent className="p-0">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4 italic">&quot;{t.text}&quot;</p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <Award className="h-12 w-12 text-accent mx-auto mb-6" />
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Ready to start your learning journey?
          </h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">
            Join thousands of students already learning on myskillora.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="xl" variant="amber">
                Create free account
              </Button>
            </Link>
            <Link href="/teachers">
              <Button
                size="xl"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                Browse teachers
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
