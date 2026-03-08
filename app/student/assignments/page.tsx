import React from "react"
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubmitAssignmentDialog } from "@/components/student/submit-assignment-dialog";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
} from "lucide-react";

export default async function StudentAssignmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get enrolled course IDs
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", user.id)
    .eq("status", "active");

  const enrolledCourseIds = enrollments?.map((e) => e.course_id) || [];

  // Fetch assignments for enrolled courses
  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      `
      *,
      course:courses(title)
    `
    )
    .in("course_id", enrolledCourseIds.length > 0 ? enrolledCourseIds : ["00000000-0000-0000-0000-000000000000"])
    .order("due_date", { ascending: true });

  // Fetch student's submissions
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("student_id", user.id);

  const submissionMap = new Map(
    submissions?.map((s) => [s.assignment_id, s]) || []
  );

  const now = new Date();

  const pendingAssignments =
    assignments?.filter((a) => {
      const submission = submissionMap.get(a.id);
      return !submission && new Date(a.due_date) > now;
    }) || [];

  const submittedAssignments =
    assignments?.filter((a) => {
      const submission = submissionMap.get(a.id);
      return submission && submission.status === "submitted";
    }) || [];

  const gradedAssignments =
    assignments?.filter((a) => {
      const submission = submissionMap.get(a.id);
      return submission && submission.status === "graded";
    }) || [];

  const overdueAssignments =
    assignments?.filter((a) => {
      const submission = submissionMap.get(a.id);
      return !submission && new Date(a.due_date) <= now;
    }) || [];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex h-16 items-center gap-4 border-b border-border bg-background px-6">
        <SidebarTrigger className="-ml-2" />
        <Separator orientation="vertical" className="h-6" />
        <div>
          <h1 className="text-lg font-semibold">Assignments</h1>
          <p className="text-sm text-muted-foreground">
            View and submit your assignments
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 space-y-6 p-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Pending"
            value={pendingAssignments.length}
            icon={<Clock className="h-5 w-5" />}
            variant="default"
          />
          <StatCard
            label="Submitted"
            value={submittedAssignments.length}
            icon={<FileText className="h-5 w-5" />}
            variant="secondary"
          />
          <StatCard
            label="Graded"
            value={gradedAssignments.length}
            icon={<CheckCircle className="h-5 w-5" />}
            variant="success"
          />
          <StatCard
            label="Overdue"
            value={overdueAssignments.length}
            icon={<AlertCircle className="h-5 w-5" />}
            variant="destructive"
          />
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="submitted">
              Submitted ({submittedAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="graded">
              Graded ({gradedAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="overdue">
              Overdue ({overdueAssignments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingAssignments.length > 0 ? (
              <div className="space-y-4">
                {pendingAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    userId={user.id}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Clock className="h-12 w-12" />}
                title="No pending assignments"
                description="You're all caught up!"
              />
            )}
          </TabsContent>

          <TabsContent value="submitted" className="space-y-4">
            {submittedAssignments.length > 0 ? (
              <div className="space-y-4">
                {submittedAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    submission={submissionMap.get(assignment.id)}
                    userId={user.id}
                    showSubmission
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<FileText className="h-12 w-12" />}
                title="No submitted assignments"
                description="Submit your first assignment"
              />
            )}
          </TabsContent>

          <TabsContent value="graded" className="space-y-4">
            {gradedAssignments.length > 0 ? (
              <div className="space-y-4">
                {gradedAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    submission={submissionMap.get(assignment.id)}
                    userId={user.id}
                    showGrade
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CheckCircle className="h-12 w-12" />}
                title="No graded assignments"
                description="Graded assignments will appear here"
              />
            )}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            {overdueAssignments.length > 0 ? (
              <div className="space-y-4">
                {overdueAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    userId={user.id}
                    isOverdue
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<AlertCircle className="h-12 w-12" />}
                title="No overdue assignments"
                description="Great job staying on track!"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant: "default" | "secondary" | "success" | "destructive";
}) {
  const bgClasses = {
    default: "bg-primary/10 text-primary",
    secondary: "bg-secondary text-secondary-foreground",
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${bgClasses[variant]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  max_points: number;
  course: { title: string } | null;
}

interface Submission {
  id: string;
  content: string | null;
  grade: number | null;
  feedback: string | null;
  status: string;
  submitted_at: string;
}

function AssignmentCard({
  assignment,
  submission,
  userId,
  showSubmission = false,
  showGrade = false,
  isOverdue = false,
}: {
  assignment: Assignment;
  submission?: Submission;
  userId: string;
  showSubmission?: boolean;
  showGrade?: boolean;
  isOverdue?: boolean;
}) {
  const dueDate = new Date(assignment.due_date);
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className={isOverdue ? "border-destructive/50" : ""}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{assignment.title}</h3>
              {isOverdue && <Badge variant="destructive">Overdue</Badge>}
              {showSubmission && <Badge variant="secondary">Submitted</Badge>}
              {showGrade && <Badge>Graded</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {assignment.course?.title || "Unknown Course"}
            </p>
            {assignment.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {assignment.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  Due: {dueDate.toLocaleDateString()} at{" "}
                  {dueDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {!isOverdue && daysUntilDue > 0 && (
                <Badge variant="outline">
                  {daysUntilDue} day{daysUntilDue !== 1 ? "s" : ""} left
                </Badge>
              )}
              <span>Max Points: {assignment.max_points}</span>
            </div>

            {showGrade && submission && (
              <div className="mt-4 rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Grade</span>
                  <span className="text-lg font-bold">
                    {submission.grade} / {assignment.max_points}
                  </span>
                </div>
                {submission.feedback && (
                  <div className="mt-2">
                    <span className="text-sm font-medium">Feedback:</span>
                    <p className="text-sm text-muted-foreground">
                      {submission.feedback}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {!showSubmission && !showGrade && !isOverdue && (
            <SubmitAssignmentDialog
              assignmentId={assignment.id}
              assignmentTitle={assignment.title}
              userId={userId}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
      <div className="text-muted-foreground">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
