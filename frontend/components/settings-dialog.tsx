"use client";

import { useState } from "react";
import { Settings, Moon, Sun, Monitor, Archive, RotateCcw, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ArchivedSession {
  id: string;
  title: string;
  archivedAt: string;
  messageCount: number;
}

interface SettingsDialogProps {
  archivedSessions?: ArchivedSession[];
  onRestoreSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  trigger?: React.ReactNode;
}

export function SettingsDialog({
  archivedSessions = [],
  onRestoreSession,
  onDeleteSession,
  trigger,
}: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const handleRestore = (sessionId: string) => {
    onRestoreSession?.(sessionId);
  };

  const handleDelete = (sessionId: string) => {
    if (window.confirm("Permanently delete this archived session?")) {
      onDeleteSession?.(sessionId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="size-8">
            <Settings className="size-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your application preferences and archived conversations
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="archived">
              Archived Chats
              {archivedSessions.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {archivedSessions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3">Theme</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select your preferred color scheme
                </p>
                <RadioGroup value={theme} onValueChange={setTheme}>
                  <div className="grid grid-cols-3 gap-4">
                    <Label
                      htmlFor="light"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                    >
                      <RadioGroupItem value="light" id="light" className="sr-only" />
                      <Sun className="mb-3 h-6 w-6" />
                      <span className="text-sm font-medium">Light</span>
                    </Label>
                    <Label
                      htmlFor="dark"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                    >
                      <RadioGroupItem value="dark" id="dark" className="sr-only" />
                      <Moon className="mb-3 h-6 w-6" />
                      <span className="text-sm font-medium">Dark</span>
                    </Label>
                    <Label
                      htmlFor="system"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                    >
                      <RadioGroupItem value="system" id="system" className="sr-only" />
                      <Monitor className="mb-3 h-6 w-6" />
                      <span className="text-sm font-medium">System</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-2">More settings coming soon</h3>
                <p className="text-sm text-muted-foreground">
                  Additional customization options will be available in future updates.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="archived" className="py-4">
            <ScrollArea className="h-[400px] pr-4">
              {archivedSessions.length === 0 ? (
                <Card className="p-8 text-center">
                  <Archive className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-sm font-medium mb-2">No archived chats</h3>
                  <p className="text-sm text-muted-foreground">
                    Archived conversations will appear here
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {archivedSessions.map((session) => (
                    <Card key={session.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate mb-1">
                            {session.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Archived {session.archivedAt}</span>
                            <span>•</span>
                            <span>{session.messageCount} messages</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRestore(session.id)}
                            title="Restore"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(session.id)}
                            title="Delete permanently"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
