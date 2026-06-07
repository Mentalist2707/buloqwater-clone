"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { getRoleLabel, formatDateOnly } from "@/lib/utils";
import { getProfile, updateProfile } from "@/actions/profile-actions";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const r = await getProfile();
      if (r.success && r.data) { setProfile(r.data); setFormData({ name: r.data.name, phone: r.data.phone }); }
      setLoading(false);
    })();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMessage(null);
    const r = await updateProfile({ name: formData.name, phone: formData.phone });
    setMessage({ type: r.success ? "success" : "error", text: r.success ? "Profil yangilandi!" : r.error });
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) { setMessage({ type: "error", text: "Yangi parollar mos kelmaydi" }); return; }
    setSaving(true); setMessage(null);
    const r = await updateProfile({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
    if (r.success) setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setMessage({ type: r.success ? "success" : "error", text: r.success ? "Parol yangilandi!" : r.error });
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Profil" description="Shaxsiy ma'lumotlarni tahrirlash" />

      {message && (
        <div className={`mb-6 p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}

      {/* Profile Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-6">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-2xl">
              {profile?.name?.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{profile?.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge>{getRoleLabel(profile?.role)}</Badge>
                <span className="text-xs text-gray-500">Qo'shilgan: {formatDateOnly(profile?.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
        <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ism familiya</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon raqami</label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required /></div>
          <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</Button></div>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Parolni o'zgartirish</h3>
        </div>
        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Joriy parol</label><Input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yangi parol</label><Input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required minLength={6} /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tasdiqlash</label><Input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required minLength={6} /></div>
          <div className="flex justify-end"><Button type="submit" variant="outline" disabled={saving}>{saving ? "..." : "Parolni o'zgartirish"}</Button></div>
        </form>
      </div>
    </div>
  );
}
