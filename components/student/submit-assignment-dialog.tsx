"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Upload } from "lucide-react";

interface SubmitAssignmentDialogProps {
  assignmentId: string;
  assignmentTitle: string;
  userId: string;
}

export function SubmitAssignmentDialog({
  assignmentId,
  assignmentTitle,
  userId,
}: SubmitAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!content && !fileUrl) {
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("submissions").insert({
      assignment_id: assignmentId,
      student_id: userId,
      content: content || null,
      file_url: fileUrl || null,
      status: "submitted",
    });

    setLoading(false);

    if (!error) {
      setOpen(false);
      setContent("");
      setFileUrl("");
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Submit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Assignment</DialogTitle>
          <DialogDescription>
            Submit your work for &quot;{assignmentTitle}&quot;
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Your Answer</Label>
            <Textarea
              id="content"
              placeholder="Write your answer here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fileUrl">File URL (optional)</Label>
            <Input
              id="fileUrl"
              type="url"
              placeholder="https://drive.google.com/your-file"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Link to your file on Google Drive, Dropbox, etc.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (!content && !fileUrl)}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Assignment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
