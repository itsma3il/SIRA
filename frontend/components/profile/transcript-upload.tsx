"use client"

import * as React from "react"

import type { TranscriptUploadResult } from "@/lib/profile-form-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export type TranscriptUploadFieldProps = {
  value?: TranscriptUploadResult | null
  onUpload: (file: File) => Promise<void> | void
  onRemove: () => void
  uploading?: boolean
  error?: string
  disabled?: boolean
}

export function TranscriptUploadField({
  value,
  onUpload,
  onRemove,
  uploading = false,
  error,
  disabled = false,
}: TranscriptUploadFieldProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    await onUpload(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Transcript Upload</p>
            <p className="text-xs text-muted-foreground">
              Upload PDF, JPG, or PNG (max 5MB)
            </p>
          </div>
          {value ? (
            <Badge variant="secondary">Uploaded</Badge>
          ) : (
            <Badge variant="outline">Not uploaded</Badge>
          )}
        </div>

        <Input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          onChange={handleFileChange}
          disabled={disabled || uploading}
        />

        {value ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
            <div>
              <p className="text-sm font-medium">{value.original_filename}</p>
              <p className="text-xs text-muted-foreground">{value.content_type}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={disabled || uploading}
            >
              Remove
            </Button>
          </div>
        ) : null}

        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {uploading ? (
          <p className="text-xs text-muted-foreground">Uploading...</p>
        ) : null}
      </div>
    </Card>
  )
}
