import React from "react"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  Award,
  FileText,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">LearnHub</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Master Your Learning Journey with{" "}
              <span className="text-primary">LearnHub</span>
            </h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              The complete platform for students and instructors to manage
              courses, track progress, submit assignments, and earn
              certificates. All in one place.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/sign-up">
                <Button size="lg" className="gap-2">
                  Start Learning Today
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/sign-up?role=instructor">
                <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                  <Users className="h-4 w-4" />
                  Become an Instructor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
              Everything You Need to Succeed
            </h2>
            <p className="mt-4 text-muted-foreground">
              Powerful tools designed to enhance your learning experience
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6" />}
              title="Progress Tracking"
              description="Monitor your learning journey with detailed progress metrics and visual analytics."
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="Assignment Submission"
              description="Submit assignments easily and receive feedback directly from your instructors."
            />
            <FeatureCard
              icon={<Calendar className="h-6 w-6" />}
              title="Smart Calendar"
              description="Never miss a deadline with our integrated calendar and reminder system."
            />
            <FeatureCard
              icon={<Award className="h-6 w-6" />}
              title="Earn Certificates"
              description="Receive verified certificates upon course completion to showcase your achievements."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Instructor Dashboard"
              description="Create courses, manage students, and grade assignments all from one place."
            />
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Course Management"
              description="Access all your courses, materials, and resources in an organized manner."
            />
          </div>
        </div>
      </section>

      {/* For Students & Instructors */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <RoleCard
              title="For Students"
              description="Take control of your education with tools designed to help you succeed."
              features={[
                "Enroll in courses and track your progress",
                "Submit assignments before deadlines",
                "View grades and instructor feedback",
                "Manage your schedule with the calendar",
                "Earn certificates upon completion",
              ]}
              ctaText="Start Learning"
              ctaHref="/auth/sign-up"
            />
            <RoleCard
              title="For Instructors"
              description="Create impactful learning experiences and manage your students effectively."
              features={[
                "Create and publish courses easily",
                "Design assignments with due dates",
                "Review and grade submissions",
                "Track student progress and engagement",
                "Issue certificates to successful students",
              ]}
              ctaText="Start Teaching"
              ctaHref="/auth/sign-up?role=instructor"
              variant="accent"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-primary py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-balance text-3xl font-bold text-primary-foreground sm:text-4xl">
            Ready to Transform Your Learning Experience?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
            Join thousands of students and instructors already using LearnHub to
            achieve their educational goals.
          </p>
          <div className="mt-8">
            <Link href="/auth/sign-up">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 font-semibold"
              >
                Get Started for Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">LearnHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2026 LearnHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function RoleCard({
  title,
  description,
  features,
  ctaText,
  ctaHref,
  variant = "primary",
}: {
  title: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
  variant?: "primary" | "accent";
}) {
  const bgClass = variant === "accent" ? "bg-accent/10" : "bg-primary/5";
  const iconClass = variant === "accent" ? "text-accent" : "text-primary";

  return (
    <div
      className={`rounded-2xl ${bgClass} border border-border p-8 sm:p-10`}
    >
      <h3 className="text-2xl font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <ul className="mt-6 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} />
            <span className="text-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Link href={ctaHref}>
          <Button
            variant={variant === "accent" ? "outline" : "default"}
            className="gap-2"
          >
            {ctaText}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
