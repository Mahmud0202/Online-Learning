"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function EnrollCourseDialog({
  courseId,
  userId,
  courseTitle,
}: {
  courseId: string
  userId: string
  courseTitle: string
}) {

  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const enroll = async () => {
    setLoading(true)

    await supabase.from("enrollments").insert({
      student_id: userId,
      course_id: courseId,
      progress: 0,
      status: "active"
    })

    setLoading(false)

    location.reload()
  }

  return (
    <Button onClick={enroll} disabled={loading} className="w-full">
      Enroll Course
    </Button>
  )
}