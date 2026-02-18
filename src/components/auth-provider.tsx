"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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

    useEffect(() => {
        let mounted = true;

        async function getInitialSession() {
            try {
                console.log("AuthProvider: [DEBUG] Starting getInitialSession");

                // Add a local timeout for the initial session fetch
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Supabase getSession timeout")), 10000)
                );

                const { data: { session: initialSession }, error } = await Promise.race([
                    sessionPromise,
                    timeoutPromise
                ]) as any;

                console.log("AuthProvider: [DEBUG] getSession finished, session exists:", !!initialSession);

                if (error) {
                    console.error("AuthProvider: [DEBUG] getSession error:", error);
                    throw error;
                }

                if (mounted) {
                    setSession(initialSession);
                    setUser(initialSession?.user ?? null);

                    if (initialSession?.user) {
                        console.log("AuthProvider: [DEBUG] Fetching profile for user:", initialSession.user.id);
                        const { data: profile, error: profileError } = await supabase
                            .from("profiles")
                            .select("role")
                            .eq("id", initialSession.user.id)
                            .single();

                        if (profileError) {
                            console.error("AuthProvider: [DEBUG] Profile fetch error:", profileError);
                        } else {
                            console.log("AuthProvider: [DEBUG] Profile fetched, role:", profile?.role);
                            setRole(profile?.role ?? null);
                        }
                    }
                }
            } catch (err) {
                console.error("AuthProvider: Error getting initial session:", err);
            } finally {
                if (mounted) {
                    console.log("AuthProvider: [DEBUG] Finishing getInitialSession, setting loading=false");
                    setLoading(false);
                }
            }
        }

        getInitialSession();

        console.log("AuthProvider: [DEBUG] Setting up onAuthStateChange listener");
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            console.log("AuthProvider: [DEBUG] Auth State Change EVENT:", event, "Session exists:", !!currentSession);

            if (mounted) {
                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    console.log("AuthProvider: [DEBUG] Fetching profile on state change for:", currentSession.user.id);
                    const { data: profile, error: profileError } = await supabase
                        .from("profiles")
                        .select("role")
                        .eq("id", currentSession.user.id)
                        .single();

                    if (profileError) {
                        console.error("AuthProvider: [DEBUG] Profile fetch error (on change):", profileError);
                    } else {
                        console.log("AuthProvider: [DEBUG] Profile fetched (on change), role:", profile?.role);
                        setRole(profile?.role ?? null);
                    }
                } else {
                    setRole(null);
                }

                console.log("AuthProvider: [DEBUG] Setting loading=false (on auth state change)");
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
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
