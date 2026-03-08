-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('student', 'instructor')) default 'student',
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;

create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Courses table
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  instructor_id uuid references public.profiles(id) on delete cascade,
  thumbnail_url text,
  status text default 'draft',
  created_at timestamptz default now()
);

alter table public.courses enable row level security;

drop policy if exists "courses_select" on public.courses;
drop policy if exists "courses_insert" on public.courses;
drop policy if exists "courses_update" on public.courses;
drop policy if exists "courses_delete" on public.courses;

create policy "courses_select" on public.courses for select using (true);
create policy "courses_insert" on public.courses for insert with check (auth.uid() = instructor_id);
create policy "courses_update" on public.courses for update using (auth.uid() = instructor_id);
create policy "courses_delete" on public.courses for delete using (auth.uid() = instructor_id);

-- Enrollments table
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  progress integer default 0,
  status text default 'active',
  enrolled_at timestamptz default now(),
  unique(student_id, course_id)
);

alter table public.enrollments enable row level security;

drop policy if exists "enrollments_select" on public.enrollments;
drop policy if exists "enrollments_insert" on public.enrollments;
drop policy if exists "enrollments_update" on public.enrollments;

create policy "enrollments_select" on public.enrollments for select using (auth.uid() = student_id);
create policy "enrollments_insert" on public.enrollments for insert with check (auth.uid() = student_id);
create policy "enrollments_update" on public.enrollments for update using (auth.uid() = student_id);

-- Assignments table
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  max_points integer default 100,
  created_at timestamptz default now()
);

alter table public.assignments enable row level security;

drop policy if exists "assignments_select" on public.assignments;
drop policy if exists "assignments_insert" on public.assignments;
drop policy if exists "assignments_update" on public.assignments;

create policy "assignments_select" on public.assignments for select using (true);
create policy "assignments_insert" on public.assignments for insert with check (
  exists (select 1 from public.courses where id = course_id and instructor_id = auth.uid())
);
create policy "assignments_update" on public.assignments for update using (
  exists (select 1 from public.courses where id = course_id and instructor_id = auth.uid())
);

-- Submissions table
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.assignments(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  content text,
  file_url text,
  grade integer,
  feedback text,
  status text default 'pending',
  submitted_at timestamptz default now(),
  unique(assignment_id, student_id)
);

alter table public.submissions enable row level security;

drop policy if exists "submissions_select" on public.submissions;
drop policy if exists "submissions_insert" on public.submissions;
drop policy if exists "submissions_update" on public.submissions;

create policy "submissions_select" on public.submissions for select using (auth.uid() = student_id);
create policy "submissions_insert" on public.submissions for insert with check (auth.uid() = student_id);
create policy "submissions_update" on public.submissions for update using (auth.uid() = student_id);

-- Calendar events table
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  event_date timestamptz not null,
  event_type text default 'reminder',
  course_id uuid references public.courses(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.calendar_events enable row level security;

drop policy if exists "events_select" on public.calendar_events;
drop policy if exists "events_insert" on public.calendar_events;
drop policy if exists "events_update" on public.calendar_events;
drop policy if exists "events_delete" on public.calendar_events;

create policy "events_select" on public.calendar_events for select using (auth.uid() = user_id);
create policy "events_insert" on public.calendar_events for insert with check (auth.uid() = user_id);
create policy "events_update" on public.calendar_events for update using (auth.uid() = user_id);
create policy "events_delete" on public.calendar_events for delete using (auth.uid() = user_id);

-- Certificates table
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  certificate_number text unique,
  issued_at timestamptz default now(),
  unique(student_id, course_id)
);

alter table public.certificates enable row level security;

drop policy if exists "certificates_select" on public.certificates;
drop policy if exists "certificates_insert" on public.certificates;

create policy "certificates_select" on public.certificates for select using (auth.uid() = student_id);
create policy "certificates_insert" on public.certificates for insert with check (
  exists (select 1 from public.courses where id = course_id and instructor_id = auth.uid())
);
