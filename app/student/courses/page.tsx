import React from "react"
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnrollCourseDialog } from "@/components/student/enroll-course-dialog";
import {
  BookOpen,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react";

export default async function StudentCoursesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch enrolled courses
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      `
      *,
      course:courses(*, instructor:profiles!courses_instructor_id_fkey(full_name))
    `
    )
    .eq("student_id", user.id);

  // Fetch available courses (not enrolled)
  const enrolledCourseIds = enrollments?.map((e) => e.course_id) || [];
  
  const { data: availableCourses } = await supabase
    .from("courses")
    .select("*, instructor:profiles!courses_instructor_id_fkey(full_name)")
    .eq("status", "published")
    .not("id", "in", `(${enrolledCourseIds.length > 0 ? enrolledCourseIds.join(",") : "00000000-0000-0000-0000-000000000000"})`);

  const activeCourses = enrollments?.filter((e) => e.status === "active") || [];
  const completedCourses = enrollments?.filter((e) => e.status === "completed") || [];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex h-16 items-center gap-4 border-b border-border bg-background px-6">
        <SidebarTrigger className="-ml-2" />
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">My Courses</h1>
          <p className="text-sm text-muted-foreground">
            Manage your enrolled courses
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 space-y-6 p-6">
        <Tabs defaultValue="enrolled" className="space-y-6">
          <TabsList>
            <TabsTrigger value="enrolled">
              Enrolled ({activeCourses.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedCourses.length})
            </TabsTrigger>
            <TabsTrigger value="browse">Browse Courses</TabsTrigger>
          </TabsList>

          <TabsContent value="enrolled" className="space-y-4">
            {activeCourses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeCourses.map((enrollment) => (
                  <CourseCard
                    key={enrollment.id}
                    course={enrollment.course}
                    progress={enrollment.progress || 0}
                    enrolledAt={enrollment.enrolled_at}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<BookOpen className="h-12 w-12" />}
                title="No enrolled courses"
                description="Browse available courses and start learning today!"
              />
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedCourses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completedCourses.map((enrollment) => (
                  <CourseCard
                    key={enrollment.id}
                    course={enrollment.course}
                    progress={100}
                    enrolledAt={enrollment.enrolled_at}
                    completedAt={enrollment.completed_at}
                    isCompleted
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CheckCircle className="h-12 w-12" />}
                title="No completed courses"
                description="Complete your enrolled courses to see them here."
              />
            )}
          </TabsContent>

          <TabsContent value="browse" className="space-y-4">
            {availableCourses && availableCourses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {availableCourses.map((course) => (
                  <BrowseCourseCard
                    key={course.id}
                    course={course}
                    userId={user.id}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<BookOpen className="h-12 w-12" />}
                title="No available courses"
                description="Check back later for new courses."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  instructor: { full_name: string | null } | null;
}

function CourseCard({
  course,
  progress,
  enrolledAt,
  completedAt,
  isCompleted = false,
}: {
  course: Course;
  progress: number;
  enrolledAt: string;
  completedAt?: string | null;
  isCompleted?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url || "/placeholder.svg"}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-1 text-base">{course.title}</CardTitle>
          {isCompleted && (
            <Badge variant="secondary" className="ml-2 shrink-0">
              <CheckCircle className="mr-1 h-3 w-3" />
              Completed
            </Badge>
          )}
        </div>
        {course.category && (
          <Badge variant="outline" className="w-fit">
            {course.category}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {course.description || "No description available"}
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{course.instructor?.full_name || "Unknown Instructor"}</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {isCompleted && completedAt
              ? `Completed ${new Date(completedAt).toLocaleDateString()}`
              : `Enrolled ${new Date(enrolledAt).toLocaleDateString()}`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function BrowseCourseCard({
  course,
  userId,
}: {
  course: Course;
  userId: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url || "/placeholder.svg"}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1 text-base">{course.title}</CardTitle>
        {course.category && (
          <Badge variant="outline" className="w-fit">
            {course.category}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {course.description || "No description available"}
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{course.instructor?.full_name || "Unknown Instructor"}</span>
        </div>
        <EnrollCourseDialog courseId={course.id} courseTitle={course.title} userId={userId} />
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
