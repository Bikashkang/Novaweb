"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { VideoCall } from "@/lib/video-calls/calls";

type WaitingRoomProps = {
  call: VideoCall;
  appointmentId: number;
  userId: string;
  isDoctor: boolean;
  partnerName: string | null;
  onAdmit?: () => void;
};

export function WaitingRoom({
  call,
  appointmentId,
  userId,
  isDoctor,
  partnerName,
  onAdmit,
}: WaitingRoomProps) {
  const supabase = getSupabaseBrowserClient();
  const [callStatus, setCallStatus] = useState<VideoCall>(call);

  // Update local state when call prop changes
  useEffect(() => {
    setCallStatus(call);
  }, [call]);

  useEffect(() => {
    // Subscribe to call status updates
    const subscription = supabase
      .channel(`video-call:${call.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "video_calls",
          filter: `id=eq.${call.id}`,
        },
        (payload: any) => {
          console.log("Waiting room received update:", payload.new);
          setCallStatus(payload.new as VideoCall);
          // If status changed to active and user is patient, trigger admission
          if (payload.new.status === "active" && !isDoctor && onAdmit) {
            onAdmit();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [call.id, isDoctor, supabase, onAdmit]);

  if (isDoctor) {
    // Doctor view - show waiting patients
    // Patient is waiting if status is "waiting" AND patient has joined (patient_joined_at is set)
    const patientWaiting = callStatus.status === "waiting" && !!callStatus.patient_joined_at;
    
    // Debug logging
    console.log("Doctor waiting room state:", {
      status: callStatus.status,
      patient_joined_at: callStatus.patient_joined_at,
      patientWaiting,
    });

    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="max-w-md w-full bg-white rounded-lg border p-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Waiting Room</h2>
            <p className="text-slate-600">
              {patientWaiting
                ? `${partnerName || "Patient"} is waiting to join`
                : "No one is waiting"}
            </p>
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === "development" && (
              <p className="text-xs text-slate-400 mt-2">
                Status: {callStatus.status} | Patient joined: {callStatus.patient_joined_at ? "Yes" : "No"}
              </p>
            )}
          </div>

          {patientWaiting && (
            <button
              onClick={onAdmit}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Admit Patient
            </button>
          )}

          {callStatus.status === "active" && (
            <p className="mt-4 text-sm text-green-600">Call is active</p>
          )}
        </div>
      </div>
    );
  }

  // Patient view - waiting for doctor
  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="max-w-md w-full bg-white rounded-lg border p-6 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Waiting for Doctor</h2>
          <p className="text-slate-600">
            {partnerName ? `Waiting for ${partnerName} to join...` : "Waiting for doctor to join..."}
          </p>
          <p className="text-sm text-slate-500 mt-2">You will be admitted when the doctor is ready</p>
        </div>
        <div className="mt-6">
          <div className="flex space-x-2 justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}


