"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Shield } from "lucide-react";

interface Props {
  teacherId: string;
  userId: string;
  isApproved: boolean;
}

export function TeacherApprovalActions({ teacherId, userId, isApproved }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const updateApproval = async (action: "approve" | "reject" | "suspend") => {
    setIsLoading(action);
    try {
      const res = await fetch("/api/admin/teachers/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, userId, action }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast({
        title: action === "approve" ? "Teacher approved!" : action === "reject" ? "Teacher rejected" : "Teacher suspended",
        variant: action === "approve" ? "default" : "destructive",
      });

      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  if (isApproved) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="text-error border-error/30 hover:bg-error/10"
        disabled={isLoading !== null}
        onClick={() => void updateApproval("suspend")}
      >
        <Shield className="h-4 w-4" />
        {isLoading === "suspend" ? "Suspending..." : "Suspend"}
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="text-error border-error/30 hover:bg-error/10"
        disabled={isLoading !== null}
        onClick={() => void updateApproval("reject")}
      >
        <XCircle className="h-4 w-4" />
        {isLoading === "reject" ? "Rejecting..." : "Reject"}
      </Button>
      <Button
        size="sm"
        variant="amber"
        disabled={isLoading !== null}
        onClick={() => void updateApproval("approve")}
      >
        <CheckCircle className="h-4 w-4" />
        {isLoading === "approve" ? "Approving..." : "Approve"}
      </Button>
    </div>
  );
}
