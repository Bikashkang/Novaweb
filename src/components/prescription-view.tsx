"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Prescription } from "@/lib/prescriptions/prescriptions";

type PrescriptionViewProps = {
  prescription: Prescription;
  isDoctor?: boolean;
};

export function PrescriptionView({ prescription, isDoctor = false }: PrescriptionViewProps) {
  const supabase = getSupabaseBrowserClient();
  const [patientName, setPatientName] = useState<string>("");
  const [doctorName, setDoctorName] = useState<string>("");
  const [doctorDetails, setDoctorDetails] = useState<{ phone?: string; email?: string; speciality?: string; registration_number?: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNames() {
      // Use patient_name from prescription if available, otherwise load from profile
      if (prescription.patient_name) {
        setPatientName(prescription.patient_name);
      } else {
        const { data: patientProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", prescription.patient_id)
          .single();
        if (patientProfile) {
          setPatientName(patientProfile.full_name || "Unknown Patient");
        }
      }

      // Load doctor name and details
      const { data: doctorProfile } = await supabase
        .from("profiles")
        .select("full_name, phone, email, speciality, registration_number")
        .eq("id", prescription.doctor_id)
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
    loadNames();
  }, [prescription.patient_id, prescription.doctor_id, prescription.patient_name, supabase]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 print:p-8 print:border-0">
      {/* Header with NOVAHDL Logo */}
      <div className="mb-8 pb-6 border-b border-slate-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 print:w-20 print:h-20">
              <Image
                src="/assets/novahdl_logo-removebg-preview.png"
                alt="NOVAHDL Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">NOVAHDL</h1>
              <p className="text-sm text-slate-600">SOLUTIONS PVT. LTD</p>
              <p className="text-xs text-slate-500 mt-1">HEALTHY DIGITAL LIFE</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-900 space-y-1">
              <p className="font-bold">{doctorName}</p>
              {doctorDetails.speciality && (
                <p className="font-bold">{doctorDetails.speciality}</p>
              )}
              {doctorDetails.registration_number && (
                <p>
                  <span className="font-medium">Reg. No:</span> {doctorDetails.registration_number}
                </p>
              )}
              {doctorDetails.phone && (
                <p>
                  <span className="font-medium">Phone:</span> {doctorDetails.phone}
                </p>
              )}
              {doctorDetails.email && (
                <p>
                  <span className="font-medium">Email:</span> {doctorDetails.email}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Patient Info */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-700">PATIENT INFORMATION</h3>
          <p className="text-sm font-semibold text-slate-700">
            Date: {formatDate(prescription.created_at)}
          </p>
        </div>
        <div className="text-sm text-slate-900 space-y-1">
          {prescription.appointment_id && (
            <p>
              <span className="font-medium">Appointment ID:</span> {prescription.appointment_id}
            </p>
          )}
          <p>
            <span className="font-medium">Name:</span> {patientName}
          </p>
          {prescription.patient_age && (
            <p>
              <span className="font-medium">Age:</span> {prescription.patient_age}
            </p>
          )}
          {prescription.patient_address && (
            <p>
              <span className="font-medium">Address:</span> {prescription.patient_address}
            </p>
          )}
        </div>
      </div>

      {/* Observations */}
      {prescription.observations && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">OBSERVATIONS</h3>
          <div className="text-sm text-slate-900 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">
            {prescription.observations}
          </div>
        </div>
      )}

      {/* Medicines */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">PRESCRIBED MEDICINES</h3>
        <div className="space-y-3">
          {prescription.medicines.map((medicine, index) => (
            <div
              key={index}
              className="border border-slate-200 rounded-lg p-4 bg-slate-50"
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-slate-700">Medicine:</span>
                  <span className="ml-2 text-slate-900">{medicine.name}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Dosage:</span>
                  <span className="ml-2 text-slate-900">{medicine.dosage}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Frequency:</span>
                  <span className="ml-2 text-slate-900">{medicine.frequency}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Duration:</span>
                  <span className="ml-2 text-slate-900">{medicine.duration}</span>
                </div>
                {medicine.instructions && (
                  <div className="col-span-2">
                    <span className="font-medium text-slate-700">Instructions:</span>
                    <span className="ml-2 text-slate-900">{medicine.instructions}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signature - Bottom Right */}
      {prescription.doctor_signature && (
        <div className="mt-8 pt-6 border-t border-slate-300">
          <div className="flex justify-end">
            <div className="text-right">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={prescription.doctor_signature}
                alt="Doctor Signature"
                className="max-w-xs h-auto border border-slate-200 rounded ml-auto"
              />
              <p className="text-sm font-semibold text-slate-900 mt-2">{doctorName}</p>
              {doctorDetails.speciality && (
                <p className="text-sm text-slate-700 mt-1">{doctorDetails.speciality}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  );
}

