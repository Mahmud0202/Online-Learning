"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle } from "lucide-react";

interface Submission {
  id: string;
  content: string | null;
  file_url: string | null;
  student: { full_name: string | null } | null;
  assignment: { title: string } | null;
}

interface GradeSubmissionDialogProps {
  submission: Submission;
  maxPoints: number;
}

export function GradeSubmissionDialog({
  submission,
  maxPoints,
}: GradeSubmissionDialogProps) {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async () => {
    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > maxPoints) {
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("submissions")
      .update({
        grade: gradeNum,
        feedback: feedback || null,
        status: "graded",
        graded_at: new Date().toISOString(),
      })
      .eq("id", submission.id);

    setLoading(false);

    if (!error) {
      setOpen(false);
      setGrade("");
      setFeedback("");
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <CheckCircle className="h-4 w-4" />
          Grade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Grade Submission</DialogTitle>
          <DialogDescription>
            Grade the submission from {submission.student?.full_name || "Unknown Student"} for &quot;{submission.assignment?.title}&quot;
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {submission.content && (
            <div className="space-y-2">
              <Label>Student&apos;s Answer</Label>
              <div className="rounded-lg bg-muted p-3 text-sm max-h-40 overflow-y-auto">
                {submission.content}
              </div>
            </div>
          )}
          {submission.file_url && (
            <div className="space-y-2">
              <Label>Attached File</Label>
              <a
                href={submission.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View File
              </a>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="grade">Grade (out of {maxPoints}) *</Label>
            <Input
              id="grade"
              type="number"
              min="0"
              max={maxPoints}
              placeholder={`0 - ${maxPoints}`}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback (optional)</Label>
            <Textarea
              id="feedback"
              placeholder="Provide feedback for the student..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !grade ||
              parseInt(grade) < 0 ||
              parseInt(grade) > maxPoints
            }
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Grade"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
