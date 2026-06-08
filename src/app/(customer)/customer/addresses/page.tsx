"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { getCustomerProfile, updateCustomerAddress } from "@/actions/customer-order-actions";

export default function CustomerAddressesPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [form, setForm] = useState({ address: "", landmark: "", locationLink: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await getCustomerProfile();
      if (r.success && r.data) {
        setProfile(r.data);
        setForm({ address: r.data.address || "", landmark: r.data.landmark || "", locationLink: r.data.locationLink || "" });
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const r = await updateCustomerAddress(form);
    if (r.success) {
      setIsEditOpen(false);
      setToast("Manzil yangilandi!");
      setTimeout(() => setToast(null), 3000);
      const pr = await getCustomerProfile();
      if (pr.success && pr.data) setProfile(pr.data);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-lg mx-auto pb-20">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-800 shadow-lg"><p className="text-sm font-medium">✅ {toast}</p></div>}

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📍 Mening Manzilim</h1>

      {profile ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">🏠</span>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{profile.address || "Manzil kiritilmagan"}</p>
                {profile.landmark && <p className="text-xs text-gray-500 mt-0.5">Mo'ljal: {profile.landmark}</p>}
              </div>
            </div>

            {profile.locationLink && (
              <a href={profile.locationLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                🗺️ Xaritada ko'rish
              </a>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-3 bg-gray-50 dark:bg-gray-700/50">
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
              ✏️ Tahrirlash
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border">
          <p className="text-4xl mb-3">📍</p>
          <p className="text-gray-500">Manzil kiritilmagan</p>
          <Button className="mt-4" onClick={() => setIsEditOpen(true)}>+ Manzil qo'shish</Button>
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Manzilni tahrirlash">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manzil</label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Yunusobod 7-kvartal, 15-uy" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mo'ljal</label>
            <Input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} placeholder="Sariq darvoza yonida" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yandex Maps linki</label>
            <div className="flex gap-2">
              <Input value={form.locationLink} onChange={(e) => setForm({ ...form, locationLink: e.target.value })} placeholder="https://yandex.uz/maps/..." className="flex-1" />
              <a href="https://yandex.uz/maps" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-blue-600 hover:bg-gray-200 whitespace-nowrap flex items-center">🗺️</a>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Bekor</Button>
            <Button type="submit" disabled={saving}>{saving ? "..." : "Saqlash"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
