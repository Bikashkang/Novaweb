"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type ProfileData = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  created_at: string | null;
  doctor_slug: string | null;
  speciality: string | null;
  registration_number: string | null;
};

export default function ProfilePage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    speciality: "",
    registration_number: "",
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.replace("/auth/sign-in");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, phone, role, created_at, doctor_slug, speciality, registration_number")
      .eq("id", userData.user.id)
      .single();

    if (profileError) {
      setError("Failed to load profile: " + profileError.message);
      setLoading(false);
      return;
    }

    const profileInfo: ProfileData = {
      full_name: profileData?.full_name || null,
      email: userData.user.email || null,
      phone: profileData?.phone || null,
      role: profileData?.role || null,
      created_at: profileData?.created_at || null,
      doctor_slug: profileData?.doctor_slug || null,
      speciality: profileData?.speciality || null,
      registration_number: profileData?.registration_number || null,
    };

    setProfile(profileInfo);
    setFormData({
      full_name: profileInfo.full_name || "",
      phone: profileInfo.phone || "",
      speciality: profileInfo.speciality || "",
      registration_number: profileInfo.registration_number || "",
    });
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (!formData.full_name.trim()) {
      setError("Full name is required");
      setSaving(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("Not authenticated");
      setSaving(false);
      return;
    }

    const updateData: any = {
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim() || null,
    };

    // Only update speciality and registration_number for doctors and medical professionals
    if (profile?.role === "doctor" || profile?.role === "medical_professional") {
      updateData.speciality = formData.speciality.trim() || null;
      updateData.registration_number = formData.registration_number.trim() || null;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userData.user.id);

    if (updateError) {
      setError("Failed to update profile: " + updateError.message);
      setSaving(false);
      return;
    }

    setSuccess("Profile updated successfully!");
    setEditing(false);
    await loadProfile();
    setSaving(false);
  }

  function handleCancel() {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        speciality: profile.speciality || "",
        registration_number: profile.registration_number || "",
      });
    }
    setEditing(false);
    setError(null);
    setSuccess(null);
  }

  if (loading) {
    return (
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="container mx-auto p-6">
        <div className="text-center text-red-600">
          {error || "Failed to load profile"}
        </div>
      </main>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <main className="container mx-auto p-6 max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My Profile</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            ) : (
              <p className="text-slate-900">{profile.full_name || "Not set"}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <p className="text-slate-900">{profile.email || "Not set"}</p>
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed here</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </label>
            {editing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555 123 4567"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-slate-900">{profile.phone || "Not set"}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Role
            </label>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {profile.role || "patient"}
            </div>
          </div>

          {/* Doctor Slug (if doctor) */}
          {profile.role === "doctor" && profile.doctor_slug && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Doctor Identifier
              </label>
              <p className="text-slate-900 font-mono text-sm">{profile.doctor_slug}</p>
              <p className="text-xs text-slate-500 mt-1">Used for appointment bookings</p>
            </div>
          )}

          {/* Speciality (for doctors and medical professionals) */}
          {(profile.role === "doctor" || profile.role === "medical_professional") && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Speciality
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.speciality}
                  onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                  placeholder="e.g., Cardiology, Pediatrics, etc."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-slate-900">{profile.speciality || "Not set"}</p>
              )}
            </div>
          )}

          {/* Registration Number (for doctors and medical professionals) */}
          {(profile.role === "doctor" || profile.role === "medical_professional") && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Registration Number
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  placeholder="Professional registration number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-slate-900">{profile.registration_number || "Not set"}</p>
              )}
            </div>
          )}

          {/* Account Created */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Account Created
            </label>
            <p className="text-slate-900">{formatDate(profile.created_at)}</p>
          </div>

          {/* Edit Actions */}
          {editing && (
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

