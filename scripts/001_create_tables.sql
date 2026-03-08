-- LearnHub Database Schema - Tables Only

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

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;
CREATE POLICY "Allow users to insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Courses policies
DROP POLICY IF EXISTS "Allow public read access to courses" ON public.courses;
CREATE POLICY "Allow public read access to courses" ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow instructors to create courses" ON public.courses;
CREATE POLICY "Allow instructors to create courses" ON public.courses FOR INSERT WITH CHECK (auth.uid() = instructor_id);

DROP POLICY IF EXISTS "Allow instructors to update own courses" ON public.courses;
CREATE POLICY "Allow instructors to update own courses" ON public.courses FOR UPDATE USING (auth.uid() = instructor_id);

DROP POLICY IF EXISTS "Allow instructors to delete own courses" ON public.courses;
CREATE POLICY "Allow instructors to delete own courses" ON public.courses FOR DELETE USING (auth.uid() = instructor_id);

-- Enrollments policies
DROP POLICY IF EXISTS "Allow enrolled students and instructors to view enrollments" ON public.enrollments;
CREATE POLICY "Allow enrolled students and instructors to view enrollments" ON public.enrollments FOR SELECT USING (
  auth.uid() = student_id OR 
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_id AND courses.instructor_id = auth.uid())
);

DROP POLICY IF EXISTS "Allow students to enroll" ON public.enrollments;
CREATE POLICY "Allow students to enroll" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Allow updates to enrollments" ON public.enrollments;
CREATE POLICY "Allow updates to enrollments" ON public.enrollments FOR UPDATE USING (
  auth.uid() = student_id OR 
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_id AND courses.instructor_id = auth.uid())
);

-- Assignments policies
DROP POLICY IF EXISTS "Allow public read access to assignments" ON public.assignments;
CREATE POLICY "Allow public read access to assignments" ON public.assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow instructors to manage assignments" ON public.assignments;
CREATE POLICY "Allow instructors to manage assignments" ON public.assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_id AND courses.instructor_id = auth.uid())
);

-- Submissions policies
DROP POLICY IF EXISTS "Allow viewing own submissions" ON public.submissions;
CREATE POLICY "Allow viewing own submissions" ON public.submissions FOR SELECT USING (
  auth.uid() = student_id OR
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.courses c ON c.id = a.course_id
    WHERE a.id = assignment_id AND c.instructor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Allow students to submit" ON public.submissions;
CREATE POLICY "Allow students to submit" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Allow updates to submissions" ON public.submissions;
CREATE POLICY "Allow updates to submissions" ON public.submissions FOR UPDATE USING (
  auth.uid() = student_id OR
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.courses c ON c.id = a.course_id
    WHERE a.id = assignment_id AND c.instructor_id = auth.uid()
  )
);

-- Calendar events policies
DROP POLICY IF EXISTS "Allow users to manage own calendar events" ON public.calendar_events;
CREATE POLICY "Allow users to manage own calendar events" ON public.calendar_events FOR ALL USING (auth.uid() = user_id);

-- Certificates policies
DROP POLICY IF EXISTS "Allow viewing certificates" ON public.certificates;
CREATE POLICY "Allow viewing certificates" ON public.certificates FOR SELECT USING (
  auth.uid() = student_id OR
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_id AND courses.instructor_id = auth.uid())
);

DROP POLICY IF EXISTS "Allow instructors to issue certificates" ON public.certificates;
CREATE POLICY "Allow instructors to issue certificates" ON public.certificates FOR INSERT WITH CHECK (
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
