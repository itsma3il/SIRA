"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ProfilesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="p-4">
      <div className="grid gap-3">
        <h2 className="text-lg font-semibold text-foreground">Profiles error</h2>
        <p className="text-sm text-muted-foreground">
          We could not load profile data. Please try again.
        </p>
        <Button onClick={reset} className="justify-self-start">
          Retry
        </Button>
      </div>
    </Card>
  );
}
