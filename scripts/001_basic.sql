-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'student' check (role in ('student', 'instructor')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Create courses table
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  instructor_id uuid references auth.users(id) on delete cascade,
  thumbnail_url text,
  status text default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz default now()
);

-- Create enrollments table
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  progress integer default 0,
  status text default 'active' check (status in ('active', 'completed', 'dropped')),
  enrolled_at timestamptz default now(),
  unique(student_id, course_id)
);

-- Create assignments table
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  max_points integer default 100,
  created_at timestamptz default now()
);

-- Create submissions table
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.assignments(id) on delete cascade,
  student_id uuid references auth.users(id) on delete cascade,
  content text,
  file_url text,
  grade integer,
  feedback text,
  status text default 'pending' check (status in ('pending', 'submitted', 'graded')),
  submitted_at timestamptz default now(),
  unique(assignment_id, student_id)
);

-- Create calendar_events table
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  event_date timestamptz not null,
  event_type text default 'reminder' check (event_type in ('deadline', 'class', 'reminder', 'exam')),
  course_id uuid references public.courses(id) on delete set null,
  created_at timestamptz default now()
);

-- Create certificates table
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  issued_at timestamptz default now(),
  certificate_url text,
  unique(student_id, course_id)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.calendar_events enable row level security;
alter table public.certificates enable row level security;

-- Simple RLS policies allowing authenticated users
create policy "profiles_all" on public.profiles for all using (true) with check (true);
create policy "courses_all" on public.courses for all using (true) with check (true);
create policy "enrollments_all" on public.enrollments for all using (true) with check (true);
create policy "assignments_all" on public.assignments for all using (true) with check (true);
create policy "submissions_all" on public.submissions for all using (true) with check (true);
create policy "calendar_all" on public.calendar_events for all using (true) with check (true);
create policy "certificates_all" on public.certificates for all using (true) with check (true);
