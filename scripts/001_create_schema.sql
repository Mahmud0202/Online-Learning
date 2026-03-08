-- LearnHub Database Schema
-- Online Learning Project Management System

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(course_id, student_id)
);

-- Assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  max_points INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment submissions
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  grade INTEGER CHECK (grade >= 0),
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  UNIQUE(assignment_id, student_id)
);

-- Calendar events
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  event_type TEXT DEFAULT 'reminder' CHECK (event_type IN ('assignment', 'class', 'reminder', 'deadline')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificates
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  certificate_number TEXT UNIQUE NOT NULL,
  UNIQUE(student_id, course_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runs)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "courses_select_all" ON public.courses;
DROP POLICY IF EXISTS "courses_insert_instructor" ON public.courses;
DROP POLICY IF EXISTS "courses_update_instructor" ON public.courses;
DROP POLICY IF EXISTS "courses_delete_instructor" ON public.courses;
DROP POLICY IF EXISTS "enrollments_select_own" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_insert_student" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_update_own" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_delete_own" ON public.enrollments;
DROP POLICY IF EXISTS "assignments_select_all" ON public.assignments;
DROP POLICY IF EXISTS "assignments_insert_instructor" ON public.assignments;
DROP POLICY IF EXISTS "assignments_update_instructor" ON public.assignments;
DROP POLICY IF EXISTS "assignments_delete_instructor" ON public.assignments;
DROP POLICY IF EXISTS "submissions_select_own" ON public.submissions;
DROP POLICY IF EXISTS "submissions_insert_student" ON public.submissions;
DROP POLICY IF EXISTS "submissions_update_own" ON public.submissions;
DROP POLICY IF EXISTS "calendar_select_own" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_insert_own" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_update_own" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_delete_own" ON public.calendar_events;
DROP POLICY IF EXISTS "certificates_select_own" ON public.certificates;
DROP POLICY IF EXISTS "certificates_insert_instructor" ON public.certificates;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);

-- Courses policies
CREATE POLICY "courses_select_all" ON public.courses FOR SELECT USING (true);
CREATE POLICY "courses_insert_instructor" ON public.courses FOR INSERT WITH CHECK (
  auth.uid() = instructor_id AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'instructor')
);
CREATE POLICY "courses_update_instructor" ON public.courses FOR UPDATE USING (auth.uid() = instructor_id);
CREATE POLICY "courses_delete_instructor" ON public.courses FOR DELETE USING (auth.uid() = instructor_id);

-- Enrollments policies
CREATE POLICY "enrollments_select_own" ON public.enrollments FOR SELECT USING (
  auth.uid() = student_id OR 
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_id AND courses.instructor_id = auth.uid())
);
CREATE POLICY "enrollments_insert_student" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "enrollments_update_own" ON public.enrollments FOR UPDATE USING (
  auth.uid() = student_id OR 
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_id AND courses.instructor_id = auth.uid())
);
CREATE POLICY "enrollments_delete_own" ON public.enrollments FOR DELETE USING (auth.uid() = student_id);

-- Assignments policies
CREATE POLICY "assignments_select_all" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "assignments_insert_instructor" ON public.assignments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_id AND courses.instructor_id = auth.uid())
);
CREATE POLICY "assignments_update_instructor" ON public.assignments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_id AND courses.instructor_id = auth.uid())
);
CREATE POLICY "assignments_delete_instructor" ON public.assignments FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_id AND courses.instructor_id = auth.uid())
);

-- Submissions policies
CREATE POLICY "submissions_select_own" ON public.submissions FOR SELECT USING (
  auth.uid() = student_id OR
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.courses c ON c.id = a.course_id
    WHERE a.id = assignment_id AND c.instructor_id = auth.uid()
  )
);
CREATE POLICY "submissions_insert_student" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "submissions_update_own" ON public.submissions FOR UPDATE USING (
  auth.uid() = student_id OR
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.courses c ON c.id = a.course_id
    WHERE a.id = assignment_id AND c.instructor_id = auth.uid()
  )
);

-- Calendar events policies
CREATE POLICY "calendar_select_own" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "calendar_insert_own" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calendar_update_own" ON public.calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "calendar_delete_own" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);

-- Certificates policies
CREATE POLICY "certificates_select_own" ON public.certificates FOR SELECT USING (
  auth.uid() = student_id OR
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_id AND courses.instructor_id = auth.uid())
);
CREATE POLICY "certificates_insert_instructor" ON public.certificates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_id AND courses.instructor_id = auth.uid())
);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
