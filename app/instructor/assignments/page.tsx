import React from "react"
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateAssignmentDialog } from "@/components/instructor/create-assignment-dialog";
import { GradeSubmissionDialog } from "@/components/instructor/grade-submission-dialog";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle,
  PlusCircle,
  Users,
} from "lucide-react";

export default async function InstructorAssignmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch instructor's courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .eq("instructor_id", user.id);

  const courseIds = courses?.map((c) => c.id) || [];
  const courseMap = new Map(courses?.map((c) => [c.id, c.title]) || []);

  // Fetch assignments for instructor's courses
  const { data: assignments } = await supabase
    .from("assignments")
    .select("*")
    .in("course_id", courseIds.length > 0 ? courseIds : ["00000000-0000-0000-0000-000000000000"])
    .order("due_date", { ascending: true });

  // Fetch all submissions for these assignments
  const assignmentIds = assignments?.map((a) => a.id) || [];
  const { data: submissions } = await supabase
    .from("submissions")
    .select(
      `
      *,
      student:profiles!submissions_student_id_fkey(full_name),
      assignment:assignments(title, max_points, course_id)
    `
    )
    .in("assignment_id", assignmentIds.length > 0 ? assignmentIds : ["00000000-0000-0000-0000-000000000000"])
    .order("submitted_at", { ascending: false });

  const pendingSubmissions = submissions?.filter((s) => s.status === "submitted") || [];
  const gradedSubmissions = submissions?.filter((s) => s.status === "graded") || [];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex h-16 items-center gap-4 border-b border-border bg-background px-6">
        <SidebarTrigger className="-ml-2" />
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Assignments</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage course assignments
          </p>
        </div>
        {courses && courses.length > 0 && (
          <CreateAssignmentDialog courses={courses} />
        )}
      </header>

      {/* Content */}
      <div className="flex-1 space-y-6 p-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments?.length || 0}</p>
                <p className="text-sm text-muted-foreground">
                  Total Assignments
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingSubmissions.length}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{gradedSubmissions.length}</p>
                <p className="text-sm text-muted-foreground">Graded</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="submissions">
              Submissions to Review ({pendingSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="assignments">
              All Assignments ({assignments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="graded">
              Graded ({gradedSubmissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="space-y-4">
            {pendingSubmissions.length > 0 ? (
              <div className="space-y-4">
                {pendingSubmissions.map((submission) => (
                  <Card key={submission.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {submission.assignment?.title}
                            </h3>
                            <Badge variant="secondary">Pending Review</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {courseMap.get(submission.assignment?.course_id)}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>
                              Submitted by: {submission.student?.full_name || "Unknown"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(submission.submitted_at).toLocaleString()}
                            </span>
                          </div>
                          {submission.content && (
                            <div className="mt-2 rounded-lg bg-muted p-3">
                              <p className="text-sm">{submission.content}</p>
                            </div>
                          )}
                        </div>
                        <GradeSubmissionDialog
                          submission={submission}
                          maxPoints={submission.assignment?.max_points || 100}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Clock className="h-12 w-12" />}
                title="No pending submissions"
                description="All submissions have been reviewed"
              />
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            {assignments && assignments.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base line-clamp-1">
                        {assignment.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {courseMap.get(assignment.course_id)}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {assignment.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Max Points: {assignment.max_points}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<FileText className="h-12 w-12" />}
                title="No assignments yet"
                description="Create your first assignment to get started"
              />
            )}
          </TabsContent>

          <TabsContent value="graded" className="space-y-4">
            {gradedSubmissions.length > 0 ? (
              <div className="space-y-4">
                {gradedSubmissions.map((submission) => (
                  <Card key={submission.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {submission.assignment?.title}
                            </h3>
                            <Badge>Graded</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>
                              Student: {submission.student?.full_name || "Unknown"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium">
                              Grade: {submission.grade}/{submission.assignment?.max_points}
                            </span>
                            {submission.feedback && (
                              <span className="text-muted-foreground">
                                Feedback provided
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CheckCircle className="h-12 w-12" />}
                title="No graded submissions"
                description="Graded assignments will appear here"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
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
