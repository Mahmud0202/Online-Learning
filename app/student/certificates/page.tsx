"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, Share2, Calendar } from "lucide-react";

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
  courses: {
    title: string;
    description: string | null;
  };
}

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchCertificates();
  }, []);

  async function fetchCertificates() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("certificates")
      .select("*, courses(title, description)")
      .eq("student_id", user.id)
      .order("issued_at", { ascending: false });

    setCertificates(data || []);
    setLoading(false);
  }

  function downloadCertificate(cert: Certificate) {
    const certificateContent = `
      ═══════════════════════════════════════════════════════════════
      
                         CERTIFICATE OF COMPLETION
      
      ═══════════════════════════════════════════════════════════════
      
      This is to certify that the holder has successfully completed
      
                           ${cert.courses.title}
      
      Certificate Number: ${cert.certificate_number}
      Date of Issue: ${new Date(cert.issued_at).toLocaleDateString()}
      
      ═══════════════════════════════════════════════════════════════
                              LearnHub
      ═══════════════════════════════════════════════════════════════
    `;

    const blob = new Blob([certificateContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificate-${cert.certificate_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function shareCertificate(cert: Certificate) {
    if (navigator.share) {
      await navigator.share({
        title: `Certificate - ${cert.courses.title}`,
        text: `I completed ${cert.courses.title} on LearnHub! Certificate #${cert.certificate_number}`,
        url: window.location.href,
      });
    }
  }

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
        <h1 className="text-3xl font-bold text-foreground">My Certificates</h1>
        <p className="text-muted-foreground">Your achievements and completed courses</p>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Certificates Yet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Complete courses to earn certificates. Your achievements will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {certificates.map((cert) => (
            <Card key={cert.id} className="overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-accent" />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{cert.courses.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">Certificate of Completion</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Verified</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
                  <div className="text-center space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Certificate Number
                    </p>
                    <p className="font-mono text-sm font-semibold">{cert.certificate_number}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Issued on{" "}
                    {new Date(cert.issued_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => downloadCertificate(cert)}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => shareCertificate(cert)}
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="flex items-center gap-4 py-6">
          <div className="p-3 rounded-xl bg-primary/10">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Keep Learning!</h3>
            <p className="text-sm text-muted-foreground">
              Complete more courses to earn additional certificates and showcase your skills.
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="/student/courses">Browse Courses</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
