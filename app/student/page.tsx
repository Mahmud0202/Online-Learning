import React from "react"
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Award,
  Calendar,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export default async function StudentDashboard() {
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

  // Fetch enrolled courses with progress
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      `
      *,
      course:courses(*)
    `
    )
    .eq("student_id", user.id)
    .eq("status", "active");

  // Fetch upcoming assignments
  const { data: upcomingAssignments } = await supabase
    .from("assignments")
    .select(
      `
      *,
      course:courses(title)
    `
    )
    .gte("due_date", new Date().toISOString())
    .order("due_date", { ascending: true })
    .limit(5);

  // Fetch certificates
  const { data: certificates } = await supabase
    .from("certificates")
    .select("*")
    .eq("student_id", user.id);

  // Fetch upcoming calendar events
  const { data: upcomingEvents } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", user.id)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(3);

  const enrolledCourses = enrollments?.length || 0;
  const totalCertificates = certificates?.length || 0;
  const averageProgress =
    enrollments && enrollments.length > 0
      ? Math.round(
          enrollments.reduce((acc, e) => acc + (e.progress || 0), 0) /
            enrollments.length
        )
      : 0;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex h-16 items-center gap-4 border-b border-border bg-background px-6">
        <SidebarTrigger className="-ml-2" />
        <Separator orientation="vertical" className="h-6" />
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {profile?.full_name || "Student"}
          </p>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Enrolled Courses"
            value={enrolledCourses}
            icon={<BookOpen className="h-5 w-5" />}
            description="Active courses"
          />
          <StatsCard
            title="Assignments Due"
            value={upcomingAssignments?.length || 0}
            icon={<FileText className="h-5 w-5" />}
            description="Pending submissions"
          />
          <StatsCard
            title="Certificates"
            value={totalCertificates}
            icon={<Award className="h-5 w-5" />}
            description="Earned so far"
          />
          <StatsCard
            title="Avg. Progress"
            value={`${averageProgress}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            description="Across all courses"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* My Courses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">My Courses</CardTitle>
              <Link href="/student/courses">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrollments && enrollments.length > 0 ? (
                enrollments.slice(0, 3).map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {enrollment.course?.title || "Untitled Course"}
                      </h4>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress
                          value={enrollment.progress || 0}
                          className="h-2 flex-1"
                        />
                        <span className="text-sm text-muted-foreground">
                          {enrollment.progress || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BookOpen className="mb-2 h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">No enrolled courses yet</p>
                  <Link href="/student/courses" className="mt-2">
                    <Button size="sm">Browse Courses</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Assignments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Upcoming Assignments</CardTitle>
              <Link href="/student/assignments">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingAssignments && upcomingAssignments.length > 0 ? (
                upcomingAssignments.slice(0, 3).map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-4 rounded-lg border border-border p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{assignment.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {assignment.course?.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(assignment.due_date).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="mb-2 h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">No upcoming assignments</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Upcoming Events</CardTitle>
            <Link href="/student/calendar">
              <Button variant="ghost" size="sm" className="gap-1">
                View Calendar <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 rounded-lg border border-border p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                      <Calendar className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.start_time).toLocaleDateString()} at{" "}
                        {new Date(event.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No upcoming events</p>
                <Link href="/student/calendar" className="mt-2">
                  <Button size="sm" variant="outline">
                    Add Event
                  </Button>
                </Link>
              </div>
            )}
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
