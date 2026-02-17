"use client";
import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Medicine, PrescriptionFormData } from "@/lib/prescriptions/prescriptions";
import { MedicineInput } from "./medicine-input";
import { SignaturePad } from "./signature-pad";

type PrescriptionFormProps = {
  appointmentId: number | null;
  patientId: string;
  onSave: (data: PrescriptionFormData) => void;
  onCancel: () => void;
  initialData?: PrescriptionFormData;
};

export function PrescriptionForm({
  appointmentId,
  patientId,
  onSave,
  onCancel,
  initialData,
}: PrescriptionFormProps) {
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState<string>("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [patientAddress, setPatientAddress] = useState<string>("");
  const [doctorName, setDoctorName] = useState<string>("");
  const [doctorId, setDoctorId] = useState<string>("");
  const [observations, setObservations] = useState(initialData?.observations || "");
  const [medicines, setMedicines] = useState<Medicine[]>(
    initialData?.medicines && initialData.medicines.length > 0
      ? initialData.medicines
      : [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]
  );
  const [signature, setSignature] = useState<string | null>(initialData?.doctor_signature || null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;
      if (!currentUserId) {
        setLoading(false);
        return;
      }
      setDoctorId(currentUserId);

      // Load patient profile for default values
      const { data: patientProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", patientId)
        .single();
      if (patientProfile) {
        // Use initial data if available, otherwise use profile name
        setPatientName(initialData?.patient_name || patientProfile.full_name || "");
      } else {
        setPatientName(initialData?.patient_name || "");
      }

      // Set patient age from initial data if available
      if (initialData?.patient_age) {
        setPatientAge(initialData.patient_age);
      }

      // Set patient address from initial data if available
      if (initialData?.patient_address) {
        setPatientAddress(initialData.patient_address);
      }

      // Load doctor profile
      const { data: doctorProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", currentUserId)
        .single();
      if (doctorProfile) {
        setDoctorName(doctorProfile.full_name || "Unknown Doctor");
      }

      // Load appointment details if available
      if (appointmentId) {
        const { data: appointment } = await supabase
          .from("appointments")
          .select("appt_date, appt_time")
          .eq("id", appointmentId)
          .single();
        // Appointment data can be used for context if needed
      }

      setLoading(false);
    }
    loadData();
  }, [appointmentId, patientId, supabase, initialData]);

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
    ]);
  };

  const updateMedicine = (index: number, medicine: Medicine) => {
    const updated = [...medicines];
    updated[index] = medicine;
    setMedicines(updated);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate patient name
    if (!patientName.trim()) {
      alert("Please enter patient name");
      return;
    }

    // Validate medicines
    const validMedicines = medicines.filter(
      (m) => m.name.trim() && m.dosage.trim() && m.frequency.trim() && m.duration.trim()
    );

    if (validMedicines.length === 0) {
      alert("Please add at least one medicine with all required fields");
      return;
    }

    if (!signature) {
      alert("Please provide a signature");
      return;
    }

    setSaving(true);
    const formData: PrescriptionFormData = {
      appointment_id: appointmentId,
      patient_name: patientName.trim(),
      patient_age: patientAge.trim(),
      patient_address: patientAddress.trim(),
      observations: observations.trim(),
      medicines: validMedicines,
      doctor_signature: signature,
    };
    onSave(formData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient and Doctor Details */}
      <div className="bg-slate-50 p-4 rounded-lg">
        <h3 className="font-semibold text-slate-900 mb-3">Patient & Doctor Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Patient Name *
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter patient name"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Patient Age
              </label>
              <input
                type="text"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="e.g., 35 years"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Patient Address
            </label>
            <textarea
              value={patientAddress}
              onChange={(e) => setPatientAddress(e.target.value)}
              placeholder="Enter patient address"
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Doctor
            </label>
            <div className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900">
              {doctorName}
            </div>
          </div>
        </div>
      </div>

      {/* Observations */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Observations / Notes
        </label>
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Enter clinical observations, diagnosis, or notes..."
          rows={5}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Medicines */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-slate-700">
            Prescribed Medicines *
          </label>
          <button
            type="button"
            onClick={addMedicine}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Medicine
          </button>
        </div>
        <div className="space-y-3">
          {medicines.map((medicine, index) => (
            <MedicineInput
              key={index}
              value={medicine}
              onChange={(m) => updateMedicine(index, m)}
              onRemove={() => removeMedicine(index)}
            />
          ))}
        </div>
      </div>

      {/* Signature */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Doctor Signature *
        </label>
        {!showSignaturePad && (
          <div className="space-y-2">
            {signature ? (
              <div className="border border-slate-300 rounded-lg p-4 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signature}
                  alt="Signature"
                  className="max-w-xs h-auto border border-slate-200 rounded"
                />
                <button
                  type="button"
                  onClick={() => setShowSignaturePad(true)}
                  className="mt-2 px-3 py-1 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                >
                  Change Signature
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSignaturePad(true)}
                className="px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-500 hover:text-blue-600"
              >
                Add Signature
              </button>
            )}
          </div>
        )}
        {showSignaturePad && (
          <SignaturePad
            onSave={(sig) => {
              setSignature(sig);
              setShowSignaturePad(false);
            }}
            onCancel={() => setShowSignaturePad(false)}
            initialSignature={signature}
          />
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Prescription"}
        </button>
      </div>
    </form>
  );
}

