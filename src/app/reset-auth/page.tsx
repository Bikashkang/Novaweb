"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetAuthPage() {
    const router = useRouter();
    const supabase = getSupabaseBrowserClient();
    const [status, setStatus] = useState("Initializing...");
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        console.log(msg);
        setLogs(prev => [...prev, msg]);
    };

    useEffect(() => {
        async function reset() {
            try {
                addLog("Starting deep reset...");

                // 1. Clear Storage
                setStatus("Clearing Local Storage...");
                localStorage.clear();
                sessionStorage.clear();
                addLog("LocalStorage and SessionStorage cleared.");

                // 2. Clear IndexedDB (Supabase often uses this)
                setStatus("Clearing IndexedDB...");
                const dbs = await window.indexedDB.databases();
                for (const db of dbs) {
                    if (db.name) {
                        window.indexedDB.deleteDatabase(db.name);
                        addLog(`Deleted database: ${db.name}`);
                    }
                }

                // 3. Clear Service Workers and Caches
                setStatus("Clearing Service Workers & Caches...");
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                        addLog("Unregistered a service worker.");
                    }
                }

                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    for (const name of cacheNames) {
                        await caches.delete(name);
                        addLog(`Deleted cache: ${name}`);
                    }
                }

                // 4. Supabase Sign Out
                setStatus("Signing out from Supabase...");
                try {
                    await supabase.auth.signOut();
                    addLog("Supabase sign out successful.");
                } catch (e) {
                    addLog(`Sign out error (ignoring): ${e}`);
                }

                // 5. Clear Cookies more thoroughly
                setStatus("Clearing Cookies...");
                const cookies = document.cookie.split(";");
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i];
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

                    // Clear for all common domains and paths
                    const domains = [window.location.hostname, "." + window.location.hostname, ""];
                    const paths = ["/", ""];

                    domains.forEach(d => {
                        paths.forEach(p => {
                            let cookieString = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                            if (d) cookieString += `;domain=${d}`;
                            if (p) cookieString += `;path=${p}`;
                            document.cookie = cookieString;
                        });
                    });
                }
                addLog("Cookies cleared.");

                setStatus("Done! Redirecting in 3 seconds...");
                setTimeout(() => {
                    window.location.href = "/";
                }, 3000);
            } catch (err) {
                addLog(`CRITICAL ERROR during reset: ${err}`);
                setStatus("Reset failed. See logs below.");
            }
        }

        reset();
    }, [supabase]);

    return (
        <div className="p-10 flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 font-sans">
            <h1 className="text-3xl font-bold mb-6 text-blue-600">Deep Reset Utility</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl border border-slate-200">
                <p className="text-xl mb-4 font-semibold text-center">{status}</p>
                <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1">{`> ${log}`}</div>
                    ))}
                </div>
                <p className="mt-6 text-slate-500 text-sm text-center">
                    This utility will clear all local data, cookies, and service workers to fix the "data hanging" issue.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                    Run Again
                </button>
            </div>
        </div>
    );
}
