"use client"

import * as React from "react"

import type { TranscriptUploadResult } from "@/lib/profile-form-types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadList,
  FileUploadItem,
  FileUploadItemMetadata,
  FileUploadItemProgress,
  FileUploadItemDelete,
  useFileUpload,
} from "@/components/ui/file-upload"

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
  const handleUpload = async (
    files: File[],
    handlers: {
      onProgress: (file: File, progress: number) => void
      onSuccess: (file: File) => void
      onError: (file: File, error: Error) => void
    }
  ) => {
    for (const file of files) {
      try {
        handlers.onProgress(file, 20)
        await onUpload(file)
        handlers.onProgress(file, 100)
        handlers.onSuccess(file)
      } catch (uploadError) {
        handlers.onError(
          file,
          uploadError instanceof Error
            ? uploadError
            : new Error("Upload failed")
        )
      }
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

        <FileUpload
          accept="application/pdf,image/jpeg,image/png"
          maxFiles={1}
          onUpload={handleUpload}
          disabled={disabled || uploading}
        >
          <FileUploadDropzone>
            <div className="text-center">
              <p className="text-sm font-medium">Drop a file here</p>
              <p className="text-xs text-muted-foreground">
                or click to browse
              </p>
            </div>
          </FileUploadDropzone>

          <FileUploadList>
            <TranscriptUploadListItems />
          </FileUploadList>
        </FileUpload>

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

function TranscriptUploadListItems() {
  const files = useFileUpload((state) => Array.from(state.files.keys()))

  return (
    <>
      {files.map((file) => (
        <FileUploadItem key={file.name} value={file}>
          <FileUploadItemMetadata />
          <FileUploadItemProgress />
          <FileUploadItemDelete className="ml-auto text-xs text-destructive" type="button">
            Remove
          </FileUploadItemDelete>
        </FileUploadItem>
      ))}
    </>
  )
}
