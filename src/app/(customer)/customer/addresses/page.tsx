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
  const [geoLoading, setGeoLoading] = useState(false);

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

  // GPS orqali joylashuvni aniqlash
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setToast("Brauzeringiz joylashuvni qo'llab-quvvatlamaydi");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const link = `https://yandex.uz/maps/?pt=${longitude},${latitude}&z=16&l=map`;
        setForm({ ...form, locationLink: link });
        setGeoLoading(false);
        setToast("📍 Joylashuv aniqlandi!");
        setTimeout(() => setToast(null), 3000);
      },
      (error) => {
        setGeoLoading(false);
        if (error.code === 1) {
          setToast("❌ Joylashuvga ruxsat berilmadi. Brauzer sozlamalarini tekshiring.");
        } else if (error.code === 2) {
          setToast("❌ Joylashuv aniqlanmadi. Qayta urinib ko'ring.");
        } else {
          setToast("❌ Vaqt tugadi. Qayta urinib ko'ring.");
        }
        setTimeout(() => setToast(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-lg mx-auto pb-20">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 shadow-lg animate-in"><p className="text-sm font-medium">{toast}</p></div>}

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📍 Mening Manzilim</h1>

      {profile && (profile.address || profile.locationLink) ? (
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
                  src={`https://yandex.uz/map-widget/v1/?${extractMapParams(profile.locationLink)}&z=15`}
                  width="100%"
                  height="200"
                  frameBorder="0"
                  className="block"
                  allowFullScreen
                />
                <a href={profile.locationLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  🗺️ Yandex Maps-da ochish
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

          {/* Joylashuvni aniqlash */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📍 Joylashuv</label>

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
                  <span className="text-xs text-green-600 dark:text-green-400 flex-1">✅ Joylashuv belgilangan</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, locationLink: "" })}>O'chirish</Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleGetLocation} disabled={geoLoading}>
                    {geoLoading ? "..." : "📍 Qayta"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* GPS tugmasi */}
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={geoLoading}
                  className="w-full py-4 border-2 border-dashed border-primary-300 dark:border-primary-700 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all cursor-pointer disabled:opacity-50"
                >
                  {geoLoading ? (
                    <>
                      <div className="animate-spin h-6 w-6 border-3 border-primary-500 border-t-transparent rounded-full" />
                      <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">Aniqlanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl">📍</span>
                      <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">Mening joylashuvim</span>
                      <span className="text-[10px] text-gray-400">GPS orqali avtomatik aniqlash</span>
                    </>
                  )}
                </button>

                {/* Qo'lda URL kiritish */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-[10px] text-gray-400">yoki</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="flex gap-2">
                  <Input
                    value={form.locationLink}
                    onChange={(e) => setForm({ ...form, locationLink: e.target.value })}
                    placeholder="Yandex Maps linkini qo'ying..."
                    className="flex-1 text-xs"
                  />
                  <a href="https://yandex.uz/maps" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600 whitespace-nowrap flex items-center">🗺️</a>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Bekor</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saqlanmoqda..." : "✅ Saqlash"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function extractMapParams(url: string): string {
  try {
    const u = new URL(url);
    const params = u.search.slice(1);
    if (params) return params;
    // pt=69.24,41.31 formatida bo'lsa
    return "ll=69.2401,41.3111";
  } catch {
    return "ll=69.2401,41.3111";
  }
}
