import React from "react"
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // enrolled courses
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      *,
      course:courses(
        *,
        instructor:profiles!courses_instructor_id_fkey(full_name)
      )
    `)
    .eq("student_id", user.id);

  const enrolledCourseIds = enrollments?.map((e) => e.course_id) || [];

  // browse courses
  const { data: availableCourses } = await supabase
    .from("courses")
    .select(`
      *,
      instructor:profiles!courses_instructor_id_fkey(full_name)
    `)
    .eq("status", "published")
    .not(
      "id",
      "in",
      `(${enrolledCourseIds.length > 0 ? enrolledCourseIds.join(",") : "00000000-0000-0000-0000-000000000000"})`
    );

  const activeCourses =
    enrollments?.filter((e) => e.status === "active") || [];

  const completedCourses =
    enrollments?.filter((e) => e.status === "completed") || [];

  return (
    <div className="flex flex-col">

      {/* Header */}

      <header className="flex h-16 items-center gap-4 border-b px-6">
        <SidebarTrigger className="-ml-2" />
        <Separator orientation="vertical" className="h-6" />

        <div>
          <h1 className="text-lg font-semibold">My Courses</h1>
          <p className="text-sm text-muted-foreground">
            Manage your enrolled courses
          </p>
        </div>
      </header>


      {/* Content */}

      <div className="flex-1 space-y-6 p-6">

        <Tabs defaultValue="enrolled">

          <TabsList>
            <TabsTrigger value="enrolled">
              Enrolled ({activeCourses.length})
            </TabsTrigger>

            <TabsTrigger value="completed">
              Completed ({completedCourses.length})
            </TabsTrigger>

            <TabsTrigger value="browse">
              Browse Courses
            </TabsTrigger>
          </TabsList>


          {/* ENROLLED */}

          <TabsContent value="enrolled">

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
                description="Browse courses and enroll"
              />

            )}

          </TabsContent>


          {/* COMPLETED */}

          <TabsContent value="completed">

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
                description="Complete a course to see it here"
              />

            )}

          </TabsContent>


          {/* BROWSE */}

          <TabsContent value="browse">

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
                description="Check later"
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
    <Card>

      <CardHeader>
        <CardTitle>{course.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">

        <p className="text-sm text-muted-foreground">
          {course.description || "No description"}
        </p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {course.instructor?.full_name || "Instructor"}
        </div>

        <Progress value={progress} />

        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />

          {isCompleted && completedAt
            ? `Completed ${new Date(completedAt).toLocaleDateString()}`
            : `Enrolled ${new Date(enrolledAt).toLocaleDateString()}`
          }

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

    <Card>

      <CardHeader>
        <CardTitle>{course.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">

        <p className="text-sm text-muted-foreground">
          {course.description || "No description"}
        </p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {course.instructor?.full_name || "Instructor"}
        </div>

        <EnrollCourseDialog
          courseId={course.id}
          courseTitle={course.title}
          userId={userId}
        />

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
    <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-lg">

      <div className="text-muted-foreground">
        {icon}
      </div>

      <h3 className="mt-4 text-lg font-semibold">
        {title}
      </h3>

      <p className="text-sm text-muted-foreground">
        {description}
      </p>

    </div>
  );
}