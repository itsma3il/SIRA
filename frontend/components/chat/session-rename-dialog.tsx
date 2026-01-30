"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SessionRenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTitle: string;
  onRename: (newTitle: string) => void;
}

export function SessionRenameDialog({
  open,
  onOpenChange,
  currentTitle,
  onRename,
}: SessionRenameDialogProps) {
  const [title, setTitle] = useState(currentTitle);

  // Sync title when dialog opens with a different current title
  useEffect(() => {
    if (open && title !== currentTitle) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(currentTitle);
    }
  }, [open, currentTitle, title]);

  const handleRename = () => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === currentTitle) {
      onOpenChange(false);
      return;
    }
    onRename(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename session</DialogTitle>
          <DialogDescription>
            Choose a new name for this conversation
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="title">Session title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRename();
              }
            }}
            placeholder="Enter session title"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={!title.trim()}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
