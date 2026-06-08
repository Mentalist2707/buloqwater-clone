"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getProfile, updateProfile } from "@/actions/profile-actions";
import { formatDateOnly } from "@/lib/utils";

export default function CustomerSettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const r = await getProfile();
      if (r.success && r.data) { setProfile(r.data); setForm({ name: r.data.name, phone: r.data.phone }); }
      setLoading(false);
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMessage(null);
    const r = await updateProfile({ name: form.name, phone: form.phone });
    setMessage({ type: r.success ? "success" : "error", text: r.success ? "Profil yangilandi!" : r.error });
    setSaving(false);
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setMessage({ type: "error", text: "Parollar mos kelmaydi" }); return; }
    setSaving(true); setMessage(null);
    const r = await updateProfile({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
    if (r.success) setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setMessage({ type: r.success ? "success" : "error", text: r.success ? "Parol yangilandi!" : r.error });
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-lg mx-auto pb-20 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">⚙️ Sozlamalar</h1>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}

      {/* Profile */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Shaxsiy ma'lumotlar</h3>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ism</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
          <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? "..." : "Saqlash"}</Button></div>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Parolni o'zgartirish</h3>
        </div>
        <form onSubmit={handlePassword} className="p-5 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Joriy parol</label><Input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yangi parol</label><Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required minLength={6} /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tasdiqlang</label><Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required /></div>
          <div className="flex justify-end"><Button type="submit" variant="outline" disabled={saving}>{saving ? "..." : "O'zgartirish"}</Button></div>
        </form>
      </div>
    </div>
  );
}
