"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  canJoinCall,
  createVideoCall,
  getVideoCall,
  getCallToken,
  updateCallStatus,
  VideoCall,
} from "@/lib/video-calls/calls";
import { VideoCallComponent } from "@/components/video-call";
import { WaitingRoom } from "@/components/waiting-room";

export default function VideoCallPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = parseInt(params.appointmentId as string);
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [call, setCall] = useState<VideoCall | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [showWaitingRoom, setShowWaitingRoom] = useState(true);

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    async function load() {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      if (!active) return;
      setCurrentUserId(userId);

      // Check if user can join
      const { canJoin, error: joinError } = await canJoinCall(appointmentId, userId);
      if (!canJoin) {
        setError(joinError || "Cannot join call");
        setLoading(false);
        return;
      }

      // Get appointment details
      const { data: appointment } = await supabase
        .from("appointments")
        .select("patient_id, doctor_id, appt_type, status")
        .eq("id", appointmentId)
        .single();

      if (!appointment) {
        setError("Appointment not found");
        setLoading(false);
        return;
      }

      const doctorId = appointment.doctor_id;
      const patientId = appointment.patient_id;
      const userIsDoctor = userId === doctorId;
      setIsDoctor(userIsDoctor);

      // Get partner name
      const partnerId = userIsDoctor ? patientId : doctorId;
      const { data: partnerProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", partnerId)
        .single();

      setPartnerName(partnerProfile?.full_name || null);

      // Get or create video call
      let videoCall = await getVideoCall(appointmentId);
      if (!videoCall.call) {
        const { call: newCall, error: createError } = await createVideoCall(appointmentId);
        if (createError || !newCall) {
          setError(createError || "Failed to create call");
          setLoading(false);
          return;
        }
        videoCall = { call: newCall, error: null };
      }

      if (!active) return;
      setCall(videoCall.call);

      // Get token
      const { token: callToken, error: tokenError } = await getCallToken(appointmentId, userId);
      if (tokenError || !callToken) {
        setError(tokenError || "Failed to get call token");
        setLoading(false);
        return;
      }

      if (!active) return;
      setToken(callToken);

      // Mark user as joined when they enter waiting room
      if (userIsDoctor && videoCall.call && !videoCall.call.doctor_joined_at) {
        await supabase
          .from("video_calls")
          .update({ doctor_joined_at: new Date().toISOString() })
          .eq("id", videoCall.call.id);
        // Refresh call data after update
        const { data: updatedCall } = await supabase
          .from("video_calls")
          .select("*")
          .eq("id", videoCall.call.id)
          .single();
        if (updatedCall && active) {
          setCall(updatedCall as VideoCall);
        }
      } else if (!userIsDoctor && videoCall.call && !videoCall.call.patient_joined_at) {
        await supabase
          .from("video_calls")
          .update({ patient_joined_at: new Date().toISOString() })
          .eq("id", videoCall.call.id);
        // Refresh call data after update
        const { data: updatedCall } = await supabase
          .from("video_calls")
          .select("*")
          .eq("id", videoCall.call.id)
          .single();
        if (updatedCall && active) {
          setCall(updatedCall as VideoCall);
        }
      }

      // Determine if should show waiting room
      // Doctor: show waiting room if call status is waiting and patient has joined
      // Patient: show waiting room until doctor admits them (status changes to active)
      if (videoCall.call) {
        if (userIsDoctor) {
          setShowWaitingRoom(videoCall.call.status === "waiting" && !!videoCall.call.patient_joined_at);
        } else {
          setShowWaitingRoom(videoCall.call.status === "waiting");
        }
      }

      setLoading(false);

      // Subscribe to realtime updates for the video call
      if (videoCall.call) {
        const channelName = `video-call-updates:${videoCall.call.id}`;
        subscription = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "video_calls",
              filter: `id=eq.${videoCall.call.id}`,
            },
            (payload: any) => {
              console.log("Realtime update received:", payload);
              if (!active) return;
              const updatedCall = payload.new as VideoCall;
              setCall(updatedCall);
              
              // Update waiting room visibility based on new status
              if (userIsDoctor) {
                setShowWaitingRoom(updatedCall.status === "waiting" && !!updatedCall.patient_joined_at);
              } else {
                setShowWaitingRoom(updatedCall.status === "waiting");
              }
            }
          )
          .subscribe((status) => {
            console.log(`Realtime subscription status for ${channelName}:`, status);
            if (status === "SUBSCRIBED") {
              console.log("Successfully subscribed to video call updates");
            } else if (status === "CHANNEL_ERROR") {
              console.error("Error subscribing to video call updates");
            }
          });

        // Fallback: Poll for updates every 2 seconds if realtime doesn't work
        // This ensures updates work even if realtime has issues
        pollInterval = setInterval(async () => {
          if (!active) return;
          
          if (!videoCall.call) return;
          
          const { data: currentCall } = await supabase
            .from("video_calls")
            .select("*")
            .eq("id", videoCall.call.id)
            .single();
          
          if (currentCall && active) {
            const currentCallData = currentCall as VideoCall;
            // Only update if something changed
            setCall((prevCall) => {
              if (
                !prevCall ||
                currentCallData.status !== prevCall.status ||
                currentCallData.patient_joined_at !== prevCall.patient_joined_at ||
                currentCallData.doctor_joined_at !== prevCall.doctor_joined_at
              ) {
                console.log("Polling detected change:", currentCallData);
                if (userIsDoctor) {
                  setShowWaitingRoom(currentCallData.status === "waiting" && !!currentCallData.patient_joined_at);
                } else {
                  setShowWaitingRoom(currentCallData.status === "waiting");
                }
                return currentCallData;
              }
              return prevCall;
            });
          }
        }, 2000);
      }
    }

    load();
    return () => {
      active = false;
      if (subscription) {
        subscription.unsubscribe();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [appointmentId, supabase]);

  const handleAdmitPatient = async () => {
    if (!call || !currentUserId) return;

    // Update call status to active
    const { error } = await updateCallStatus(call.id, "active", currentUserId);
    if (error) {
      alert(`Failed to admit patient: ${error}`);
      return;
    }

    setShowWaitingRoom(false);
  };

  const handleCallEnd = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading video call...</p>
        </div>
      </main>
    );
  }

  if (error || !call || !token || !currentUserId) {
    return (
      <main className="container mx-auto p-6">
        <div className="max-w-md mx-auto bg-white rounded-lg border p-6">
          <h1 className="text-xl font-semibold mb-4">Cannot Join Call</h1>
          <p className="text-red-600 mb-4">{error || "Unknown error"}</p>
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
    <main className="h-screen flex flex-col">
      {showWaitingRoom ? (
        <WaitingRoom
          call={call}
          appointmentId={appointmentId}
          userId={currentUserId}
          isDoctor={isDoctor}
          partnerName={partnerName}
          onAdmit={handleAdmitPatient}
        />
      ) : (
        <VideoCallComponent
          call={call}
          token={token}
          appointmentId={appointmentId}
          userId={currentUserId}
          partnerName={partnerName}
          onCallEnd={handleCallEnd}
        />
      )}
    </main>
  );
}

