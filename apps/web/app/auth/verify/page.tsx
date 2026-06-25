import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";

export const metadata: Metadata = { title: "Verify Email" };
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mx-auto mb-4">
            <MailCheck className="h-8 w-8 text-success" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-primary mb-2">
            Check your email
          </h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            We&apos;ve sent a confirmation link to your email address. Click the link to verify your
            account and get started on myskillora.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Didn&apos;t receive an email? Check your spam folder or{" "}
            <Link href="/auth/signup" className="text-primary hover:underline">
              try signing up again
            </Link>
            .
          </p>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">Back to sign in</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
