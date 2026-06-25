"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center p-6">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-2xl font-bold font-heading">Something went wrong</h2>
      <p className="text-muted-foreground max-w-md">
        An unexpected error occurred. Please try again, or contact support if the problem persists.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
