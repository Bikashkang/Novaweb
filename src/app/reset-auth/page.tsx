"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetAuthPage() {
    const router = useRouter();
    const supabase = getSupabaseBrowserClient();
    const [status, setStatus] = useState("Initializing...");

    useEffect(() => {
        async function reset() {
            setStatus("Clearing Local Storage...");
            console.log("Cookies before clear:", document.cookie);
            localStorage.clear();
            sessionStorage.clear();

            setStatus("Signing out from Supabase...");
            try {
                await supabase.auth.signOut();
            } catch (e) {
                console.error("Sign out error:", e);
            }

            setStatus("Clearing Cookies...");
            // Simple cookie clear
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });

            setStatus("Done! Redirecting...");
            setTimeout(() => {
                window.location.href = "/";
            }, 1000);
        }

        reset();
    }, [supabase]);

    return (
        <div className="p-10 flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Resetting Auth State</h1>
            <p className="text-lg">{status}</p>
        </div>
    );
}
