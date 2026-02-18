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
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (mounted) {
                    setSession(initialSession);
                    setUser(initialSession?.user ?? null);

                    if (initialSession?.user) {
                        const { data: profile } = await supabase
                            .from("profiles")
                            .select("role")
                            .eq("id", initialSession.user.id)
                            .single();
                        setRole(profile?.role ?? null);
                    }
                }
            } catch (err) {
                console.error("AuthProvider: Error getting initial session:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        getInitialSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            console.log("AuthProvider: Auth State Change:", event);

            if (mounted) {
                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("role")
                        .eq("id", currentSession.user.id)
                        .single();
                    setRole(profile?.role ?? null);
                } else {
                    setRole(null);
                }

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
