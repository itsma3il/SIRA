"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6 py-16">
      <Card className="w-full p-4">
        <div className="grid gap-3">
          <h1 className="text-xl font-semibold text-foreground">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            We hit an unexpected error. Please try again.
          </p>
          <Button onClick={reset} className="justify-self-start">
            Try again
          </Button>
        </div>
      </Card>
    </div>
  )
}
