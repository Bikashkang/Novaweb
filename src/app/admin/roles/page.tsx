"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  email?: string | null;
  full_name: string | null;
  phone: string | null;
  role: "patient" | "doctor" | "admin" | "medical_professional";
  doctor_slug: string | null;
  speciality: string | null;
  registration_number: string | null;
};

export default function AdminRolesPage() {
  const supabase = getSupabaseBrowserClient();
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Try RPC first - it returns all users from auth.users with profile info
    const rpc = await supabase.rpc("admin_list_users");
    
    if (!rpc.error && Array.isArray(rpc.data) && rpc.data.length > 0) {
      const mapped: Profile[] = (rpc.data as any[]).map((r) => ({
        id: r.id,
        email: r.email ?? null,
        full_name: r.full_name ?? null,
        phone: r.phone ?? null,
        role: (r.role ?? "patient") as Profile["role"],
        doctor_slug: r.doctor_slug ?? null,
        speciality: r.speciality ?? null,
        registration_number: r.registration_number ?? null
      }));
      setRows(mapped);
      setLoading(false);
      return;
    }
    
    // If RPC fails or returns empty, log the error for debugging
    if (rpc.error) {
      console.error("RPC error:", rpc.error);
      setError(`Failed to load users: ${rpc.error.message}. Trying fallback...`);
    }
    
    // Fallback: Query profiles table (admin can read all profiles via RLS)
    // Note: This might miss users who don't have profiles yet
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, doctor_slug, speciality, registration_number")
      .order("created_at", { ascending: false });
    
    if (error) {
      setError(`Failed to load users: ${error.message}`);
      setRows([]);
    } else {
      // Map profiles data (emails won't be available in fallback)
      const mapped: Profile[] = (data || []).map((p: any) => ({
        id: p.id,
        email: null, // Not available from profiles table
        full_name: p.full_name ?? null,
        phone: p.phone ?? null,
        role: (p.role ?? "patient") as Profile["role"],
        doctor_slug: p.doctor_slug ?? null,
        speciality: p.speciality ?? null,
        registration_number: p.registration_number ?? null
      }));
      setRows(mapped);
      if (rpc.error) {
        setError(`Using fallback data. Some users may be missing. ${rpc.error.message}`);
      }
    }
    
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // Check current user's role explicitly to avoid single() failing when admin can read all rows
    supabase.auth.getUser().then(async ({ data: userData }) => {
      const userId = userData.user?.id;
      if (!userId) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      const admin = prof?.role === "admin";
      setIsAdmin(admin);
      if (admin) {
        await load();
      } else {
        setLoading(false);
      }
    });
  }, [supabase, load]);

  function setRowLocal(id: string, patch: Partial<Profile>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function saveRow(p: Profile) {
    setSaving((s) => ({ ...s, [p.id]: true }));
    const { error } = await supabase
      .from("profiles")
      .upsert({ 
        id: p.id, 
        role: p.role, 
        doctor_slug: p.doctor_slug,
        speciality: p.speciality,
        registration_number: p.registration_number
      }, { onConflict: "id" });
    if (error) {
      setError(`Failed to save: ${error.message}`);
    } else {
      setError(null);
    }
    setSaving((s) => ({ ...s, [p.id]: false }));
  }

  // Filter rows based on search query
  const filteredRows = rows.filter((row) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (row.full_name?.toLowerCase().includes(query)) ||
      (row.email?.toLowerCase().includes(query)) ||
      (row.phone?.toLowerCase().includes(query)) ||
      (row.role?.toLowerCase().includes(query)) ||
      (row.doctor_slug?.toLowerCase().includes(query)) ||
      (row.speciality?.toLowerCase().includes(query)) ||
      (row.registration_number?.toLowerCase().includes(query)) ||
      (row.id.toLowerCase().includes(query))
    );
  });

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Manage Roles</h1>
      <p className="text-slate-600 mb-4">Admins can search users and assign roles and optional doctor identifiers (slug).</p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {loading ? (
        <p>Loading...</p>
      ) : isAdmin === false ? (
        <p>You need admin access to view this page.</p>
      ) : (
        <>
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name, email, phone, role, doctor slug, speciality, or registration number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <p className="mt-2 text-sm text-slate-600">
                Showing {filteredRows.length} of {rows.length} users
              </p>
            )}
          </div>

          {/* User count info */}
          {!loading && rows.length > 0 && (
            <div className="mb-4 text-sm text-slate-600">
              Total users: <span className="font-semibold">{rows.length}</span>
              {searchQuery && (
                <span className="ml-4">
                  Filtered: <span className="font-semibold">{filteredRows.length}</span>
                </span>
              )}
            </div>
          )}

          {rows.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-700">No users found.</p>
              {error && (
                <p className="text-sm text-slate-500 mt-2">
                  If you expected to see users, check the error message above.
                </p>
              )}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-700">No users match your search query.</p>
              <p className="text-sm text-slate-500 mt-2">
                Try a different search term or clear the search to see all {rows.length} users.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-slate-200 rounded-lg">
                <thead>
                  <tr className="text-left border-b bg-slate-50">
                    <th className="py-3 px-4 font-semibold text-slate-900">User</th>
                    <th className="py-3 px-4 font-semibold text-slate-900">Email</th>
                    <th className="py-3 px-4 font-semibold text-slate-900">Phone</th>
                    <th className="py-3 px-4 font-semibold text-slate-900">Role</th>
                    <th className="py-3 px-4 font-semibold text-slate-900">Doctor Slug</th>
                    <th className="py-3 px-4 font-semibold text-slate-900">Speciality</th>
                    <th className="py-3 px-4 font-semibold text-slate-900">Registration #</th>
                    <th className="py-3 px-4 font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {r.full_name || "No name"}
                        </div>
                        {r.full_name && (
                          <div className="text-xs text-slate-500 mt-1">{r.id.slice(0, 8)}...</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{r.email || "-"}</td>
                      <td className="py-3 px-4 text-slate-700">{r.phone || "-"}</td>
                      <td className="py-3 px-4">
                        <select
                          className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={r.role}
                          onChange={(e) => setRowLocal(r.id, { role: e.target.value as Profile["role"] })}
                        >
                          <option value="patient">patient</option>
                          <option value="doctor">doctor</option>
                          <option value="medical_professional">medical_professional</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={r.doctor_slug || ""}
                          placeholder="doctor-identifier"
                          onChange={(e) => setRowLocal(r.id, { doctor_slug: e.target.value })}
                        />
                      </td>
                      <td className="py-3 px-4">
                        {(r.role === "doctor" || r.role === "medical_professional") ? (
                          <input
                            type="text"
                            className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={r.speciality || ""}
                            placeholder="e.g., Cardiology"
                            onChange={(e) => setRowLocal(r.id, { speciality: e.target.value })}
                          />
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {(r.role === "doctor" || r.role === "medical_professional") ? (
                          <input
                            type="text"
                            className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={r.registration_number || ""}
                            placeholder="Registration number"
                            onChange={(e) => setRowLocal(r.id, { registration_number: e.target.value })}
                          />
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                          disabled={!!saving[r.id]}
                          onClick={() => saveRow(r)}
                        >
                          {saving[r.id] ? "Saving..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}


