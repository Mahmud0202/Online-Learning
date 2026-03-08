"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users, Search, Award, BookOpen, Mail } from "lucide-react";
import { IssueCertificateDialog } from "@/components/instructor/issue-certificate-dialog";

interface Enrollment {
  id: string;
  progress: number;
  status: string;
  enrolled_at: string;
  student_id: string;
  course_id: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
  courses: {
    id: string;
    title: string;
  };
}

export default function InstructorStudentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchEnrollments();
  }, []);

  async function fetchEnrollments() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: courses } = await supabase
      .from("courses")
      .select("id")
      .eq("instructor_id", user.id);

    if (!courses || courses.length === 0) {
      setLoading(false);
      return;
    }

    const courseIds = courses.map((c) => c.id);

    const { data } = await supabase
      .from("enrollments")
      .select("*, profiles!enrollments_student_id_fkey(full_name, avatar_url), courses(id, title)")
      .in("course_id", courseIds)
      .order("enrolled_at", { ascending: false });

    setEnrollments(data || []);
    setLoading(false);
  }

  const filteredEnrollments = enrollments.filter((e) =>
    e.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.courses?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const uniqueStudents = [...new Set(enrollments.map((e) => e.student_id))].length;
  const completedCount = enrollments.filter((e) => e.status === "completed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Students</h1>
        <p className="text-muted-foreground">Manage your students and track their progress</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueStudents}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enrollments.length}</p>
                <p className="text-sm text-muted-foreground">Total Enrollments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Award className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Completions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Students</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students or courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEnrollments.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Students Yet</h3>
              <p className="text-muted-foreground">
                Students will appear here once they enroll in your courses.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={enrollment.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {enrollment.profiles?.full_name?.charAt(0) || "S"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">
                        {enrollment.profiles?.full_name || "Unknown Student"}
                      </h4>
                      <Badge
                        variant={enrollment.status === "completed" ? "default" : "secondary"}
                      >
                        {enrollment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {enrollment.courses?.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={enrollment.progress} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-12">
                        {enrollment.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Mail className="h-4 w-4" />
                    </Button>
                    {enrollment.progress >= 100 && enrollment.status !== "completed" && (
                      <IssueCertificateDialog
                        studentId={enrollment.student_id}
                        courseId={enrollment.course_id}
                        courseName={enrollment.courses?.title || ""}
                        studentName={enrollment.profiles?.full_name || "Student"}
                        onIssued={fetchEnrollments}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
