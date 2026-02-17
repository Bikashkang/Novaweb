"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPrescriptionByShareToken } from "@/lib/prescriptions/prescriptions";
import { PrescriptionView } from "@/components/prescription-view";
import {
  downloadPrescriptionPDF,
  downloadPrescriptionHTML,
  printPrescription,
} from "@/lib/prescriptions/pdf";
import type { Prescription } from "@/lib/prescriptions/prescriptions";

export default function PrescriptionSharePage() {
  const params = useParams();
  const router = useRouter();
  const shareToken = params.token as string;
  const supabase = getSupabaseBrowserClient();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>("");
  const [doctorName, setDoctorName] = useState<string>("");
  const [doctorDetails, setDoctorDetails] = useState<{ phone?: string; email?: string; speciality?: string; registration_number?: string }>({});
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingHTML, setDownloadingHTML] = useState(false);

  useEffect(() => {
    async function loadPrescription() {
      setLoading(true);
      setError(null);

      // Check authentication first
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData.user) {
        setError("Please sign in to view this shared prescription");
        setLoading(false);
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push(`/auth/sign-in?redirect=/prescriptions/share/${shareToken}`);
        }, 2000);
        return;
      }

      // Fetch prescription by share token
      const { prescription: pres, error: presError } = await getPrescriptionByShareToken(shareToken);

      if (presError || !pres) {
        setError(presError || "Prescription not found or invalid share link");
        setLoading(false);
        return;
      }

      setPrescription(pres);

      // Load patient name
      const { data: patientProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", pres.patient_id)
        .single();
      if (patientProfile) {
        setPatientName(patientProfile.full_name || pres.patient_name || "Unknown Patient");
      } else {
        setPatientName(pres.patient_name || "Unknown Patient");
      }

      // Load doctor name and details
      const { data: doctorProfile } = await supabase
        .from("profiles")
        .select("full_name, phone, email, speciality, registration_number")
        .eq("id", pres.doctor_id)
        .single();
      if (doctorProfile) {
        setDoctorName(doctorProfile.full_name || "Unknown Doctor");
        setDoctorDetails({
          phone: doctorProfile.phone || undefined,
          email: doctorProfile.email || undefined,
          speciality: doctorProfile.speciality || undefined,
          registration_number: doctorProfile.registration_number || undefined,
        });
      }

      setLoading(false);
    }

    loadPrescription();
  }, [shareToken, supabase, router]);

  const handleDownloadPDF = async () => {
    if (!prescription) return;
    setDownloadingPDF(true);
    try {
      await downloadPrescriptionPDF(prescription, patientName, doctorName, doctorDetails);
    } catch (error) {
      alert("Failed to generate PDF. Please try again.");
      console.error("PDF generation error:", error);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownloadHTML = async () => {
    if (!prescription) return;
    setDownloadingHTML(true);
    try {
      await downloadPrescriptionHTML(prescription, patientName, doctorName, doctorDetails);
    } catch (error) {
      alert("Failed to download HTML. Please try again.");
      console.error("HTML download error:", error);
    } finally {
      setDownloadingHTML(false);
    }
  };

  const handlePrint = async () => {
    if (!prescription) return;
    await printPrescription(prescription, patientName, doctorName, doctorDetails);
  };

  if (loading) {
    return (
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </main>
    );
  }

  if (error || !prescription) {
    return (
      <main className="container mx-auto p-6">
        <div className="max-w-md mx-auto bg-white rounded-lg border p-6">
          <h1 className="text-xl font-semibold mb-4">Error</h1>
          <p className="text-red-600 mb-4">{error || "Prescription not found"}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Shared Prescription</h1>
          <p className="text-slate-600">View and download this prescription</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium"
          >
            Print
          </button>
          <button
            onClick={handleDownloadHTML}
            disabled={downloadingHTML}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {downloadingHTML ? "Downloading..." : "Download HTML"}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {downloadingPDF ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>

      <PrescriptionView prescription={prescription} isDoctor={false} />
    </main>
  );
}

