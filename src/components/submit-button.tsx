"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function SubmitButton({
  children = "Submit",
  className,
  isLoading = false,
}: {
  children?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}) {
  return (
    <Button type="submit" disabled={isLoading} className={className}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
