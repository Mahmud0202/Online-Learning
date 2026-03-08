import React from "react"
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  BookOpen,
  Users,
  FileText,
  Award,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  Clock,
} from "lucide-react";

export default async function InstructorDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch instructor's courses
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("instructor_id", user.id);

  const courseIds = courses?.map((c) => c.id) || [];

  // Fetch total enrolled students
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*")
    .in("course_id", courseIds.length > 0 ? courseIds : ["00000000-0000-0000-0000-000000000000"]);

  // Fetch pending submissions
  const { data: pendingSubmissions } = await supabase
    .from("submissions")
    .select(
      `
      *,
      assignment:assignments(title, course_id),
      student:profiles!submissions_student_id_fkey(full_name)
    `
    )
    .eq("status", "submitted")
    .in(
      "assignment_id",
      (
        await supabase
          .from("assignments")
          .select("id")
          .in("course_id", courseIds.length > 0 ? courseIds : ["00000000-0000-0000-0000-000000000000"])
      ).data?.map((a) => a.id) || []
    );

  // Fetch issued certificates
  const { data: certificates } = await supabase
    .from("certificates")
    .select("*")
    .in("course_id", courseIds.length > 0 ? courseIds : ["00000000-0000-0000-0000-000000000000"]);

  const totalCourses = courses?.length || 0;
  const totalStudents = new Set(enrollments?.map((e) => e.student_id)).size;
  const pendingCount = pendingSubmissions?.length || 0;
  const certificatesIssued = certificates?.length || 0;

  const publishedCourses = courses?.filter((c) => c.status === "published") || [];
  const draftCourses = courses?.filter((c) => c.status === "draft") || [];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex h-16 items-center gap-4 border-b border-border bg-background px-6">
        <SidebarTrigger className="-ml-2" />
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Instructor Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {profile?.full_name || "Instructor"}
          </p>
        </div>
        <Link href="/instructor/courses/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Course
          </Button>
        </Link>
      </header>

      {/* Dashboard Content */}
      <div className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Courses"
            value={totalCourses}
            icon={<BookOpen className="h-5 w-5" />}
            description={`${publishedCourses.length} published`}
          />
          <StatsCard
            title="Total Students"
            value={totalStudents}
            icon={<Users className="h-5 w-5" />}
            description="Enrolled across courses"
          />
          <StatsCard
            title="Pending Reviews"
            value={pendingCount}
            icon={<FileText className="h-5 w-5" />}
            description="Submissions to grade"
          />
          <StatsCard
            title="Certificates Issued"
            value={certificatesIssued}
            icon={<Award className="h-5 w-5" />}
            description="Students certified"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* My Courses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">My Courses</CardTitle>
              <Link href="/instructor/courses">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {courses && courses.length > 0 ? (
                courses.slice(0, 4).map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{course.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {course.category || "Uncategorized"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        course.status === "published"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {course.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BookOpen className="mb-2 h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">No courses yet</p>
                  <Link href="/instructor/courses/new" className="mt-2">
                    <Button size="sm">Create Your First Course</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Submissions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Pending Submissions</CardTitle>
              <Link href="/instructor/assignments">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingSubmissions && pendingSubmissions.length > 0 ? (
                pendingSubmissions.slice(0, 4).map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center gap-4 rounded-lg border border-border p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                      <FileText className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {submission.assignment?.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        by {submission.student?.full_name || "Unknown Student"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="mb-2 h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending submissions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/instructor/courses/new">
                <Button
                  variant="outline"
                  className="h-auto w-full flex-col gap-2 p-4 bg-transparent"
                >
                  <PlusCircle className="h-6 w-6" />
                  <span>Create Course</span>
                </Button>
              </Link>
              <Link href="/instructor/assignments">
                <Button
                  variant="outline"
                  className="h-auto w-full flex-col gap-2 p-4 bg-transparent"
                >
                  <FileText className="h-6 w-6" />
                  <span>Create Assignment</span>
                </Button>
              </Link>
              <Link href="/instructor/students">
                <Button
                  variant="outline"
                  className="h-auto w-full flex-col gap-2 p-4 bg-transparent"
                >
                  <Users className="h-6 w-6" />
                  <span>View Students</span>
                </Button>
              </Link>
              <Link href="/instructor/certificates">
                <Button
                  variant="outline"
                  className="h-auto w-full flex-col gap-2 p-4 bg-transparent"
                >
                  <Award className="h-6 w-6" />
                  <span>Issue Certificate</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
