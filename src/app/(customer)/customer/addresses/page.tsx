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
  const [isMapOpen, setIsMapOpen] = useState(false);
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
    } else {
      setToast(r.error);
      setTimeout(() => setToast(null), 3000);
    }
    setSaving(false);
  };

  // Yandex Maps-dan koordinat olish
  const handleMapSelect = () => {
    setIsMapOpen(true);
  };

  const handleMapMessage = (e: MessageEvent) => {
    // Yandex Maps widget-dan xabar kelganda
    if (e.data && e.data.lat && e.data.lng) {
      const link = `https://yandex.uz/maps/?pt=${e.data.lng},${e.data.lat}&z=16&l=map`;
      setForm({ ...form, locationLink: link });
      setIsMapOpen(false);
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleMapMessage);
    return () => window.removeEventListener("message", handleMapMessage);
  }, [form]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-lg mx-auto pb-20">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 shadow-lg"><p className="text-sm font-medium">✅ {toast}</p></div>}

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📍 Mening Manzilim</h1>

      {profile ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">🏠</span>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{profile.address || "Manzil kiritilmagan"}</p>
                {profile.landmark && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Mo'ljal: {profile.landmark}</p>}
              </div>
            </div>

            {profile.locationLink && (
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <iframe
                  src={`https://yandex.uz/map-widget/v1/?${new URL(profile.locationLink).search.slice(1)}&z=15`}
                  width="100%"
                  height="200"
                  frameBorder="0"
                  className="block"
                  allowFullScreen
                />
                <a href={profile.locationLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                  🗺️ Xaritada ochish
                </a>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-3 bg-gray-50 dark:bg-gray-700/50">
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
              ✏️ Tahrirlash
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-4xl mb-3">📍</p>
          <p className="text-gray-500 dark:text-gray-400">Manzil kiritilmagan</p>
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

          {/* Xaritadan manzil tanlash */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📍 Xaritadan belgilash</label>
            
            {form.locationLink ? (
              <div className="space-y-2">
                <div className="rounded-xl overflow-hidden border border-green-200 dark:border-green-800">
                  <iframe
                    src={`https://yandex.uz/map-widget/v1/?${extractMapParams(form.locationLink)}&z=15`}
                    width="100%"
                    height="150"
                    frameBorder="0"
                    className="block"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600 dark:text-green-400 flex-1">✅ Manzil belgilangan</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, locationLink: "" })}>O'chirish</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsMapOpen(true)}>Qayta belgilash</Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all cursor-pointer"
              >
                <span className="text-3xl">🗺️</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Xaritadan joyni belgilang</span>
              </button>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Bekor</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</Button>
          </div>
        </form>
      </Modal>

      {/* Xarita Modal — Manzil belgilash */}
      <Modal open={isMapOpen} onClose={() => setIsMapOpen(false)} title="📍 Xaritadan manzil belgilang" className="max-w-2xl">
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Xaritada kerakli joyni toping va linkni nusxa olib pastga qo'ying
          </p>
          
          {/* Yandex Maps embed — Toshkent markazi */}
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <iframe
              src="https://yandex.uz/map-widget/v1/?ll=69.2401%2C41.3111&z=12&l=map"
              width="100%"
              height="350"
              frameBorder="0"
              allowFullScreen
              className="block"
            />
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
              <strong>Qanday qilish:</strong>
            </p>
            <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-decimal list-inside">
              <li>Yuqoridagi xaritada joylashuvni toping</li>
              <li><a href="https://yandex.uz/maps" target="_blank" rel="noopener noreferrer" className="underline font-medium">Yandex Maps</a> ni yangi tabda oching</li>
              <li>Kerakli joyni bosing → "Ulashish" → linkni nusxa oling</li>
              <li>Pastdagi inputga qo'ying</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yandex Maps linki</label>
            <div className="flex gap-2">
              <Input
                value={form.locationLink}
                onChange={(e) => setForm({ ...form, locationLink: e.target.value })}
                placeholder="https://yandex.uz/maps/-/..."
                className="flex-1"
              />
              <a href="https://yandex.uz/maps" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap">
                🗺️ Ochish
              </a>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsMapOpen(false)}>Bekor</Button>
            <Button onClick={() => setIsMapOpen(false)} disabled={!form.locationLink}>
              ✅ Tasdiqlash
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function extractMapParams(url: string): string {
  try {
    const u = new URL(url);
    return u.search.slice(1) || "ll=69.2401,41.3111";
  } catch {
    return "ll=69.2401,41.3111";
  }
}
