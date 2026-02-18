"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPrescriptionsByPatient } from "@/lib/prescriptions/prescriptions";
import type { Prescription } from "@/lib/prescriptions/prescriptions";

export default function PatientPrescriptionsPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadPrescriptions() {
      setLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const { prescriptions: patientPrescriptions, error: presError } =
        await getPrescriptionsByPatient(userId);

      if (presError) {
        setError(presError);
        setLoading(false);
        return;
      }

      setPrescriptions(patientPrescriptions);

      // Load doctor names
      const doctorIds = Array.from(
        new Set(patientPrescriptions.map((p) => p.doctor_id))
      );
      if (doctorIds.length > 0) {
        const { data: doctors } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", doctorIds);

        if (doctors) {
          const names: Record<string, string> = {};
          doctors.forEach((doctor) => {
            names[doctor.id] = doctor.full_name || "Unknown Doctor";
          });
          setDoctorNames(names);
        }
      }

      setLoading(false);
    }

    loadPrescriptions();
  }, [supabase]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  if (error) {
    return (
      <main className="container mx-auto p-6">
        <div className="max-w-md mx-auto bg-white rounded-lg border p-6">
          <h1 className="text-xl font-semibold mb-4">Error</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">My Prescriptions</h1>
        <p className="text-slate-600">View and download your prescriptions</p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-600">No prescriptions found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Medicines
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {prescriptions.map((prescription) => (
                <tr key={prescription.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {formatDate(prescription.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {doctorNames[prescription.doctor_id] || "Unknown Doctor"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {prescription.medicines.length} medicine
                    {prescription.medicines.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => router.push(`/prescriptions/${prescription.id}`)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

