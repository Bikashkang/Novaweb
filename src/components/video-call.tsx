"use client";
import { useEffect, useRef, useState } from "react";
import type { VideoCall } from "@/lib/video-calls/calls";
import { updateCallStatus } from "@/lib/video-calls/calls";

// Daily.co will be loaded dynamically

type VideoCallComponentProps = {
  call: VideoCall;
  token: string;
  appointmentId: number;
  userId: string;
  partnerName: string | null;
  onCallEnd?: () => void;
};

export function VideoCallComponent({
  call,
  token,
  appointmentId,
  userId,
  partnerName,
  onCallEnd,
}: VideoCallComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [callFrame, setCallFrame] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const frameRef = useRef<any>(null); // Track frame instance to prevent duplicates
  const isInitializingRef = useRef(false); // Prevent concurrent initialization
  
  // Use refs for values that shouldn't trigger re-initialization
  const tokenRef = useRef(token);
  const callRef = useRef(call);
  const userIdRef = useRef(userId);
  const partnerNameRef = useRef(partnerName);
  const onCallEndRef = useRef(onCallEnd);
  
  // Update refs when props change (always keep them in sync)
  tokenRef.current = token;
  callRef.current = call;
  userIdRef.current = userId;
  partnerNameRef.current = partnerName;
  onCallEndRef.current = onCallEnd;

  useEffect(() => {
    // Prevent re-initialization if already initializing or frame exists
    if (isInitializingRef.current || frameRef.current) {
      console.log("Skipping re-initialization - frame already exists or initializing");
      return;
    }

    setIsLoading(true);
    setError(null);
    isInitializingRef.current = true;
    
    // Use props directly (they're the source of truth)
    if (!token || !call.room_url) {
      console.error("Missing required props:", { token: !!token, room_url: !!call.room_url });
      setError("Missing video call configuration. Please try again.");
      setIsLoading(false);
      isInitializingRef.current = false;
      return;
    }

    let frame: any = null;
    let isCleanedUp = false;
    let loadingTimeout: NodeJS.Timeout | null = null;

    // Load Daily.co using script tag (more reliable for iframe embeds)
    function loadDailyCoScript(): Promise<any> {
      return new Promise((resolve, reject) => {
        // Check if already loaded
        if ((window as any).DailyIframe) {
          resolve((window as any).DailyIframe);
          return;
        }

        // Check if script is already loading
        if (document.querySelector('script[src*="daily.co"]')) {
          // Wait for it to load
          const checkInterval = setInterval(() => {
            if ((window as any).DailyIframe) {
              clearInterval(checkInterval);
              resolve((window as any).DailyIframe);
            }
          }, 100);
          setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error("Timeout waiting for Daily.co to load"));
          }, 10000);
          return;
        }

        // Load Daily.co script
        const script = document.createElement("script");
        script.src = "https://unpkg.com/@daily-co/daily-js@0.85.0/dist/daily.js";
        script.async = true;
        script.onload = () => {
          if ((window as any).DailyIframe) {
            resolve((window as any).DailyIframe);
          } else {
            reject(new Error("DailyIframe not found after script load"));
          }
        };
        script.onerror = () => {
          reject(new Error("Failed to load Daily.co script"));
        };
        document.head.appendChild(script);
      });
    }

    // Try script tag method first, fallback to module import
    loadDailyCoScript()
      .catch(() => {
        // Fallback to module import
        return import("@daily-co/daily-js").then((DailyModule) => {
          console.log("DailyModule:", DailyModule);
          console.log("DailyModule keys:", Object.keys(DailyModule));
          
          // Try to find DailyIframe in module
          const DailyIframeClass = 
            (DailyModule as any).DailyIframe ||
            (DailyModule as any).default?.DailyIframe ||
            (DailyModule as any).default;
      
          if (!DailyIframeClass || typeof DailyIframeClass.createFrame !== "function") {
            throw new Error("DailyIframe not found in module");
          }
          
          return DailyIframeClass;
        });
      })
      .then((DailyIframeClass) => {
        if (isCleanedUp) return;
        
        console.log("DailyIframeClass loaded:", DailyIframeClass);
        
        if (!DailyIframeClass || typeof DailyIframeClass.createFrame !== "function") {
          setError("Video call library error. Please refresh the page.");
          setIsLoading(false);
          return;
        }

        try {
          // Wait for container to be available (should be rendered by now)
          const initFrame = (retryCount = 0) => {
            if (isCleanedUp) return;
            
            if (!containerRef.current) {
              // Retry up to 20 times (1 second total wait) before showing error
              if (retryCount < 20) {
                setTimeout(() => {
                  if (!isCleanedUp) {
                    initFrame(retryCount + 1);
                  }
                }, 50);
                return;
              }
              // Only show error after all retries failed (1 second)
              if (!isCleanedUp) {
                console.error("Container ref still not available after retries");
                setError("Failed to initialize video call interface.");
                setIsLoading(false);
              }
              return;
            }
            
            // Check if frame already exists (prevent duplicates)
            if (frameRef.current) {
              console.warn("Frame already exists, skipping creation");
              frame = frameRef.current;
              isCleanedUp = false; // Reset cleanup flag
        return;
      }

            // Create the Daily.co iframe - Daily.co will create its own iframe inside the container
            try {
              frame = DailyIframeClass.createFrame(containerRef.current, {
        showLeaveButton: true,
                showFullscreenButton: true,
                showLocalVideo: true,
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "none",
        },
      });
            } catch (error: any) {
              console.error("Error creating Daily.co frame:", error);
              if (error?.message?.includes("Duplicate")) {
                console.warn("Duplicate frame detected, using existing frame");
                // Try to get existing frame if possible
                frame = frameRef.current;
                if (!frame) {
                  if (!isCleanedUp) {
                    setError("Video call already initialized. Please refresh the page.");
                    setIsLoading(false);
                    isInitializingRef.current = false;
                  }
                  return;
                }
              } else {
                throw error;
              }
            }

            if (!frame) {
              console.error("Failed to create Daily.co frame");
              if (!isCleanedUp) {
                setError("Failed to create video call interface.");
                setIsLoading(false);
                isInitializingRef.current = false;
              }
              return;
            }
            
            // Store frame reference
            frameRef.current = frame;

          // Handle call events BEFORE joining
          // Note: Daily.co iframe handles participants display internally

      frame.on("left-meeting", () => {
            console.log("Left meeting");
            if (!isCleanedUp) {
        updateCallStatus(call.id, "ended", userId);
        if (onCallEnd) {
          onCallEnd();
        }
            }
      });

          // Set up event handlers BEFORE joining
          
          let hasJoined = false;
          let joinImmediatelyTimeout: NodeJS.Timeout | null = null;
          
          // Function to join the call (defined before event handlers)
          const joinCall = () => {
            if (hasJoined || isCleanedUp) return;
            
            // Validate token and room URL before joining
            if (!token || !call.room_url) {
              console.error("Missing token or room URL:", { hasToken: !!token, hasRoomUrl: !!call.room_url });
              if (!isCleanedUp) {
                setError("Missing video call configuration. Please refresh the page.");
                setIsLoading(false);
              }
              return;
            }
            
            console.log("Joining call:", { 
              url: call.room_url, 
              hasToken: !!token,
              tokenLength: token?.length,
              userName: partnerName || userId 
            });
            
            const joinConfig: any = {
              url: call.room_url,
              token: token,
              userName: partnerName || userId,
            };
            
            hasJoined = true;
            
            frame.join(joinConfig)
              .then(() => {
                console.log("Join promise resolved - call joined successfully");
                // Clear all timeouts
                if (loadingTimeout) clearTimeout(loadingTimeout);
                // Note: joinImmediatelyTimeout is in outer scope, will be cleared by loaded event or timeout
                if (!isCleanedUp) {
                  console.log("Setting callFrame and clearing loading from join promise");
                  frameRef.current = frame; // Store in ref
                  setCallFrame(frame);
                  setIsLoading(false);
                  setError(null);
                  isInitializingRef.current = false; // Mark initialization complete
                  // Update call status to active
                  updateCallStatus(call.id, "active", userId).catch((err) => {
                    console.error("Failed to update call status:", err);
      });
                }
              })
              .catch((error: any) => {
                hasJoined = false; // Allow retry
                if (loadingTimeout) clearTimeout(loadingTimeout);
                console.error("Failed to join Daily.co call:", error);
                console.error("Error details:", {
                  error,
                  errorMsg: error?.errorMsg,
                  message: error?.message,
                  code: error?.code,
                  type: error?.type,
                  joinConfig: { url: call.room_url, hasToken: !!token, userName: joinConfig.userName }
                });
                
                // Extract more detailed error message
                let errorMsg = "Failed to join video call";
                if (error?.errorMsg) {
                  errorMsg = error.errorMsg;
                } else if (error?.message) {
                  errorMsg = error.message;
                } else if (error?.type) {
                  errorMsg = `Video call error: ${error.type}`;
                }
                
                // Check for specific error types
                if (error?.code === "invalid-room" || errorMsg.includes("room")) {
                  errorMsg = "Invalid room URL. Please refresh and try again.";
                } else if (error?.code === "invalid-token" || errorMsg.includes("token")) {
                  errorMsg = "Invalid access token. Please refresh and try again.";
                } else if (errorMsg.includes("network") || errorMsg.includes("connection")) {
                  errorMsg = "Network error. Please check your internet connection.";
                }
                
                console.error("Final error message:", errorMsg);
                if (!isCleanedUp) {
                  setError(errorMsg);
                  setIsLoading(false);
      }
              });
          };
          
          // Try joining immediately after a short delay (don't wait for loaded event)
          // Daily.co can handle joining even if frame isn't fully loaded
          joinImmediatelyTimeout = setTimeout(() => {
            if (!hasJoined && !isCleanedUp && frame) {
              console.log("Attempting to join call immediately");
              joinCall();
            }
          }, 500);
          
          frame.on("loaded", () => {
            console.log("Daily.co frame loaded event fired");
            if (joinImmediatelyTimeout) {
              if (joinImmediatelyTimeout) clearTimeout(joinImmediatelyTimeout);
              joinImmediatelyTimeout = null;
            }
            if (loadingTimeout) clearTimeout(loadingTimeout);
            if (!isCleanedUp && !hasJoined) {
              console.log("Frame loaded, attempting to join call");
              joinCall();
            }
          });

          frame.on("joined-meeting", () => {
            console.log("Successfully joined meeting");
            if (loadingTimeout) clearTimeout(loadingTimeout);
            if (!isCleanedUp) {
              frameRef.current = frame; // Store in ref
              setCallFrame(frame);
              setIsLoading(false);
              setError(null);
              isInitializingRef.current = false; // Mark initialization complete
              // Update call status to active
              updateCallStatus(call.id, "active", userId).catch((err) => {
                console.error("Failed to update call status:", err);
              });
            }
          });

          frame.on("participant-joined", () => {
            console.log("Participant joined - clearing loading");
            if (loadingTimeout) clearTimeout(loadingTimeout);
            if (!isCleanedUp) {
              setIsLoading(false);
              setError(null);
            }
          });

          frame.on("error", (error: any) => {
            console.error("Daily.co frame error event:", error);
            console.error("Error details:", {
              error,
              errorMsg: error?.errorMsg,
              message: error?.message,
              code: error?.code,
              type: error?.type
            });
            if (loadingTimeout) clearTimeout(loadingTimeout);
            if (!isCleanedUp) {
              const errorMsg = error?.errorMsg || error?.message || error?.type || "Video call error occurred";
              setError(errorMsg);
              setIsLoading(false);
    }
          });

          // Try joining immediately after a short delay (don't wait for loaded event)
          // Daily.co can handle joining even if frame isn't fully loaded
          joinImmediatelyTimeout = setTimeout(() => {
            if (!hasJoined && !isCleanedUp && frame) {
              console.log("Attempting to join call immediately (fallback)");
              joinCall();
            }
          }, 500);

          // Fallback: Clear loading after 2 seconds if still loading
          loadingTimeout = setTimeout(() => {
            if (!isCleanedUp && frame) {
              console.warn("Loading timeout after 2 seconds - clearing loading state");
              if (joinImmediatelyTimeout) clearTimeout(joinImmediatelyTimeout);
              frameRef.current = frame; // Store in ref
              setIsLoading(false);
              isInitializingRef.current = false; // Mark initialization complete
              // Set callFrame even if events didn't fire - the iframe might still be working
              console.log("Setting callFrame from timeout fallback");
              setCallFrame(frame);
      }
          }, 2000);
          };
          
          initFrame();
        } catch (error) {
          console.error("Error creating or joining Daily.co frame:", error);
          if (!isCleanedUp) {
            setError("Failed to initialize video call. Please refresh the page.");
            setIsLoading(false);
    }
        }
      })
      .catch((error) => {
        console.error("Failed to load Daily.co library:", error);
        if (!isCleanedUp) {
          setError("Failed to load video call library. Please check your internet connection and refresh.");
          setIsLoading(false);
        }
      });

    return () => {
      console.log("Cleaning up video call component");
      isCleanedUp = true;
      isInitializingRef.current = false;
      
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
      
      // Clean up frame
      const frameToCleanup = frameRef.current || frame;
      if (frameToCleanup) {
        try {
          console.log("Leaving and destroying Daily.co frame");
          frameToCleanup.leave().catch((err: any) => {
            console.error("Error leaving call:", err);
          });
          frameToCleanup.destroy();
          frameRef.current = null;
        } catch (error) {
          console.error("Error cleaning up frame:", error);
          frameRef.current = null;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call.id]); // Only re-run if call.id changes (new call) - other values are in refs

  // Daily.co iframe handles all controls (mute, video, end call) internally

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
          <h2 className="font-semibold">Video Call</h2>
          <p className="text-sm text-slate-600">
            {partnerName || "Call in progress"}
          </p>
      </div>

      {/* Video area */}
      <div className="flex-1 relative bg-slate-900">
        {/* Container for Daily.co iframe - Daily.co will create its own iframe inside */}
        <div 
          ref={containerRef} 
          className="w-full h-full"
          style={{ minHeight: "400px" }}
        />
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading video call...</p>
              <p className="text-sm text-slate-400 mt-2">Please allow camera and microphone access when prompted</p>
            </div>
      </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white z-30">
            <div className="text-center max-w-md p-6">
              <p className="text-red-400 mb-4">{error}</p>
          <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
                Reload Page
          </button>
        </div>
          </div>
        )}
      </div>

    </div>
  );
}

