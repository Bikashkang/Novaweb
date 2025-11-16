"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  email?: string | null;
  full_name: string | null;
  phone: string | null;
  role: "patient" | "doctor" | "admin";
  doctor_slug: string | null;
};

export default function AdminRolesPage() {
  const supabase = getSupabaseBrowserClient();
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Prefer RPC which returns all users with profiles joined
    const rpc = await supabase.rpc("admin_list_users");
    if (!rpc.error && Array.isArray(rpc.data)) {
      const mapped: Profile[] = (rpc.data as any[]).map((r) => ({
        id: r.id,
        email: r.email ?? null,
        full_name: r.full_name ?? null,
        phone: r.phone ?? null,
        role: (r.role ?? "patient") as Profile["role"],
        doctor_slug: r.doctor_slug ?? null
      }));
      setRows(mapped);
      setLoading(false);
      return;
    }
    // Fallback to profiles table
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, doctor_slug")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setRows((data as Profile[]) ?? []);
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
      .upsert({ id: p.id, role: p.role, doctor_slug: p.doctor_slug }, { onConflict: "id" });
    if (error) alert(`Failed: ${error.message}`);
    setSaving((s) => ({ ...s, [p.id]: false }));
  }

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Manage Roles</h1>
      <p className="text-slate-600 mb-4">Admins can assign roles and optional doctor identifiers (slug).</p>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : isAdmin === false ? (
        <p>You need admin access to view this page.</p>
      ) : rows.length === 0 ? (
        <p>No users.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Doctor Slug</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 pr-4">{r.full_name || r.email || r.id.slice(0, 8)}</td>
                  <td className="py-2 pr-4">{r.phone}</td>
                  <td className="py-2 pr-4">
                    <select
                      className="border rounded px-2 py-1"
                      value={r.role}
                      onChange={(e) => setRowLocal(r.id, { role: e.target.value as Profile["role"] }) }
                    >
                      <option value="patient">patient</option>
                      <option value="doctor">doctor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      className="border rounded px-2 py-1"
                      value={r.doctor_slug || ""}
                      placeholder="doctor-identifier"
                      onChange={(e) => setRowLocal(r.id, { doctor_slug: e.target.value })}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <button
                      className="rounded border px-2 py-1 disabled:opacity-50"
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
    </main>
  );
}


