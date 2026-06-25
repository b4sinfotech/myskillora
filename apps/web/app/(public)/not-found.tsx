import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center p-6">
      <div className="font-heading text-7xl font-bold text-primary/20">404</div>
      <h2 className="text-2xl font-bold font-heading">Not found</h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        This teacher or category doesn&apos;t exist or is no longer available.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/teachers">Browse teachers</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/categories">View subjects</Link>
        </Button>
      </div>
    </div>
  );
}
