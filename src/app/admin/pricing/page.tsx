"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatAmount } from "@/lib/payments/pricing";

type Pricing = {
  id: string;
  appointment_type: "video" | "in_clinic";
  doctor_id: string | null;
  doctor_name: string | null;
  amount: number;
  currency: string;
  is_active: boolean;
};

export default function PricingAdminPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    appointment_type: "video" as "video" | "in_clinic",
    doctor_id: "",
    amount: "",
    currency: "INR",
    is_active: true,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        router.replace("/auth/sign-in");
        return;
      }

      // Check if admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (!active) return;

      if (profile?.role !== "admin") {
        setError("Only admins can access this page");
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // Load pricing
      const { data: pricingData, error: pricingError } = await supabase
        .from("appointment_pricing")
        .select(`
          *,
          doctor:profiles!appointment_pricing_doctor_id_fkey(full_name)
        `)
        .order("appointment_type", { ascending: true })
        .order("doctor_id", { ascending: true, nullsFirst: true });

      if (!active) return;

      if (pricingError) {
        setError(pricingError.message);
      } else {
        const pricingWithNames: Pricing[] = (pricingData || []).map((p: any) => ({
          id: p.id,
          appointment_type: p.appointment_type,
          doctor_id: p.doctor_id,
          doctor_name: p.doctor?.full_name || null,
          amount: p.amount,
          currency: p.currency,
          is_active: p.is_active,
        }));
        setPricing(pricingWithNames);
      }

      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountInPaise = Math.round(parseFloat(formData.amount) * 100);
    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      setError("Invalid amount");
      return;
    }

    try {
      if (editingId) {
        // Update existing
        const { error: updateError } = await supabase
          .from("appointment_pricing")
          .update({
            appointment_type: formData.appointment_type,
            doctor_id: formData.doctor_id || null,
            amount: amountInPaise,
            currency: formData.currency,
            is_active: formData.is_active,
          })
          .eq("id", editingId);

        if (updateError) throw updateError;
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from("appointment_pricing")
          .insert({
            appointment_type: formData.appointment_type,
            doctor_id: formData.doctor_id || null,
            amount: amountInPaise,
            currency: formData.currency,
            is_active: formData.is_active,
          });

        if (insertError) throw insertError;
      }

      // Reload pricing
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to save pricing");
    }
  };

  const handleEdit = (item: Pricing) => {
    setEditingId(item.id);
    setFormData({
      appointment_type: item.appointment_type,
      doctor_id: item.doctor_id || "",
      amount: (item.amount / 100).toString(),
      currency: item.currency,
      is_active: item.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pricing?")) return;

    const { error } = await supabase
      .from("appointment_pricing")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin || error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h1>
            <p className="text-red-800">{error || "Only admins can access this page"}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Appointment Pricing</h1>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                appointment_type: "video",
                doctor_id: "",
                amount: "",
                currency: "INR",
                is_active: true,
              });
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Pricing
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? "Edit Pricing" : "Add New Pricing"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Appointment Type *
                  </label>
                  <select
                    value={formData.appointment_type}
                    onChange={(e) =>
                      setFormData({ ...formData, appointment_type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  >
                    <option value="video">Video Consultation</option>
                    <option value="in_clinic">In-Clinic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Doctor (leave empty for default)
                  </label>
                  <input
                    type="text"
                    value={formData.doctor_id}
                    onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                    placeholder="Doctor ID (optional)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Amount (INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="500.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Active
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingId ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {pricing.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.appointment_type === "video" ? "Video" : "In-Clinic"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.doctor_name || "Default"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatAmount(item.amount, item.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        item.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
