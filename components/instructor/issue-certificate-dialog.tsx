"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Award } from "lucide-react";

interface IssueCertificateDialogProps {
  studentId: string;
  courseId: string;
  courseName: string;
  studentName: string;
  onIssued: () => void;
}

export function IssueCertificateDialog({
  studentId,
  courseId,
  courseName,
  studentName,
  onIssued,
}: IssueCertificateDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function issueCertificate() {
    setLoading(true);

    const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const { error: certError } = await supabase.from("certificates").insert({
      student_id: studentId,
      course_id: courseId,
      certificate_number: certificateNumber,
    });

    if (!certError) {
      await supabase
        .from("enrollments")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("student_id", studentId)
        .eq("course_id", courseId);

      setOpen(false);
      onIssued();
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Award className="h-4 w-4" />
          Issue Certificate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue Certificate</DialogTitle>
          <DialogDescription>
            Issue a completion certificate for this student.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="p-4 rounded-lg bg-muted space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student:</span>
              <span className="font-medium">{studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Course:</span>
              <span className="font-medium">{courseName}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            This will mark the student as completed and generate a certificate they can download.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={issueCertificate} disabled={loading}>
            {loading ? "Issuing..." : "Issue Certificate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
