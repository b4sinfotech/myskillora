import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center p-6">
      <div className="font-heading text-8xl font-bold text-primary/20">404</div>
      <h2 className="text-2xl font-bold font-heading">Page not found</h2>
      <p className="text-muted-foreground max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/teachers">Browse teachers</Link>
        </Button>
      </div>
    </div>
  );
}
