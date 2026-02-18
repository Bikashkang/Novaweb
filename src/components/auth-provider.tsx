"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthContextType = {
    user: User | null;
    session: Session | null;
    role: string | null;
    loading: boolean;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    role: null,
    loading: true,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const supabase = getSupabaseBrowserClient();
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Track the last user ID we fetched a profile for to avoid redundant fetches
    const lastProfileFetchId = useRef<string | null>(null);

    // Safety net: if onAuthStateChange never fires (e.g. hung token refresh or
    // RLS deadlock), unblock the UI after 8 seconds so spinners never hang forever.
    useEffect(() => {
        let mounted = true;
        const timeout = setTimeout(() => {
            if (mounted) {
                setLoading((prev) => {
                    if (prev) {
                        console.warn("AuthProvider: auth timeout after 8s — forcing loading=false to unblock UI");
                    }
                    return false;
                });
            }
        }, 8000);
        return () => {
            mounted = false;
            clearTimeout(timeout);
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        // Use onAuthStateChange as the SINGLE source of truth.
        // It fires INITIAL_SESSION immediately on mount with the current session (or null),
        // eliminating the race condition between getSession() and onAuthStateChange().
        // The debounce collapses the 3–6 rapid duplicate SIGNED_IN events that Supabase
        // emits on every page load into a single execution, preventing redundant profile
        // fetches and auth state churn.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
            if (!mounted) return;

            console.log("AuthProvider: [DEBUG] Auth event (queued):", event, "| User:", currentSession?.user?.id ?? "none");

            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                if (!mounted) return;

                console.log("AuthProvider: [DEBUG] Auth event (fired):", event, "| User:", currentSession?.user?.id ?? "none");

                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    const userId = currentSession.user.id;

                    // Only fetch profile if we haven't already fetched for this user
                    if (lastProfileFetchId.current !== userId) {
                        lastProfileFetchId.current = userId;
                        try {
                            // Race the profile fetch against a 5s timeout so a hung
                            // RLS query can never keep loading=true indefinitely.
                            const profilePromise = supabase
                                .from("profiles")
                                .select("role")
                                .eq("id", userId)
                                .single();
                            const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
                                setTimeout(() => resolve({ data: null, error: new Error("Profile fetch timeout") }), 5000)
                            );
                            const { data: profile, error: profileError } = await Promise.race([profilePromise, timeoutPromise]);

                            if (mounted) {
                                if (profileError) {
                                    console.error("AuthProvider: Profile fetch error:", profileError.message);
                                    setRole(null);
                                } else {
                                    setRole(profile?.role ?? null);
                                }
                            }
                        } catch (err) {
                            console.error("AuthProvider: Profile fetch exception:", err);
                            if (mounted) setRole(null);
                        }
                    }
                } else {
                    lastProfileFetchId.current = null;
                    setRole(null);
                }

                // Only set loading=false after the INITIAL_SESSION event
                // (or any subsequent event). This ensures we don't show content
                // before we know the auth state.
                if (mounted) {
                    setLoading(false);
                }
            }, 50); // 50ms debounce: collapses rapid duplicate SIGNED_IN events
        });

        return () => {
            mounted = false;
            if (debounceTimer) clearTimeout(debounceTimer);
            subscription.unsubscribe();
        };
    }, [supabase]);


    const signOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    return (
        <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
