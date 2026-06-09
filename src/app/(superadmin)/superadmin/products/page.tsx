"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency } from "@/lib/utils";
import { getGlobalProducts, createGlobalProduct, updateGlobalProduct, deleteGlobalProduct } from "@/actions/superadmin-product-actions";

type Category = "WATER" | "PROMO" | "ACCESSORIES";
const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: "WATER", label: "Suvlar", icon: "💧" },
  { value: "PROMO", label: "Aksiyalar", icon: "🔥" },
  { value: "ACCESSORIES", label: "Aksessuarlar", icon: "🔧" },
];

export default function SuperAdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<"ALL" | Category>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "WATER" as Category, tags: "", isBottle: true });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const loadProducts = async () => { setLoading(true); const r = await getGlobalProducts(); if (r.success && r.data) setProducts(r.data as any); setLoading(false); };
  useEffect(() => { loadProducts(); }, []);

  const resetForm = () => setForm({ name: "", description: "", price: "", category: "WATER", tags: "", isBottle: true });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true); setFormError("");
    const r = await createGlobalProduct({ name: form.name, description: form.description || undefined, price: parseFloat(form.price), category: form.category, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean), isBottle: form.isBottle });
    if (r.success) { setIsCreateOpen(false); resetForm(); loadProducts(); showToast("Mahsulot qo'shildi!"); }
    else setFormError(r.error);
    setFormLoading(false);
  };

  const openEdit = (p: any) => { setEditProduct(p); setForm({ name: p.name, description: (p.description || "").replace(/#\w+/g, "").trim(), price: p.price.toString(), category: p.category, tags: (p.tags || []).join(", "), isBottle: p.isBottle }); setFormError(""); };
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editProduct) return; setFormLoading(true); setFormError("");
    const r = await updateGlobalProduct(editProduct.id, { name: form.name, description: form.description || undefined, price: parseFloat(form.price), category: form.category, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean), isBottle: form.isBottle });
    if (r.success) { setEditProduct(null); resetForm(); loadProducts(); showToast("Yangilandi!"); }
    else setFormError(r.error);
    setFormLoading(false);
  };

  const handleDelete = async () => { if (!deleteConfirm) return; setFormLoading(true); await deleteGlobalProduct(deleteConfirm.id); setDeleteConfirm(null); loadProducts(); showToast("O'chirildi!"); setFormLoading(false); };

  const filtered = products.filter((p) => {
    if (filterCategory !== "ALL" && p.category !== filterCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.tags || []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const ProductForm = ({ onSubmit, buttonText }: { onSubmit: (e: React.FormEvent) => void; buttonText: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      {formError && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">{formError}</div>}
      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kategoriya <span className="text-red-500">*</span></label><div className="grid grid-cols-3 gap-2">{CATEGORIES.map((cat) => (<button key={cat.value} type="button" className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border-2 transition-all ${form.category === cat.value ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-sm" : "border-gray-200 dark:border-gray-700"}`} onClick={() => setForm({ ...form, category: cat.value })}><span className="text-2xl">{cat.icon}</span><span className="text-xs font-medium text-gray-700 dark:text-gray-300">{cat.label}</span></button>))}</div></div>
      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nomi <span className="text-red-500">*</span></label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="19L Kumush Suv" required /></div>
      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tavsif</label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Toza tog' suvidan filtrlangan" /></div>
      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tavsiya narxi (so'm) <span className="text-red-500">*</span></label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="15000" required min={0} /></div>
      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">#Taglar <span className="text-xs text-gray-400 dark:text-gray-500">(vergul bilan ajrating)</span></label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="suv, 19litr, kumush, premium" /><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Direktor qidirganda taglar bo'yicha topiladi</p></div>
      <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 cursor-pointer border border-gray-100 dark:border-gray-700"><input type="checkbox" checked={form.isBottle} onChange={(e) => setForm({ ...form, isBottle: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500" /><div><p className="text-sm font-medium text-gray-700 dark:text-gray-300">🫙 Baxla hisoblansin</p></div></label>
      <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setEditProduct(null); resetForm(); }}>Bekor</Button><Button type="submit" disabled={formLoading}>{formLoading ? "Saqlanmoqda..." : buttonText}</Button></div>
    </form>
  );

  return (
    <div className="relative">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 shadow-lg animate-in"><p className="text-sm font-medium">✅ {toast}</p></div>}

      <PageHeader title="Mahsulotlar Bazasi" description={`${products.length} ta shablon — Direktorlar shu bazadan foydalanadi`} action={<Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>+ Yangi Mahsulot</Button>} />

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300">💡 <strong>Shablon mahsulotlar</strong> — Direktor yangi tovar qo'shganda shu ro'yxatdan tanlaydi va narxini o'zi belgilaydi. #taglar qidiruv uchun.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Nomi yoki #tag..." className="max-w-xs" />
        <div className="flex items-center gap-2 flex-wrap">
          <button className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterCategory === "ALL" ? "bg-primary-500 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`} onClick={() => setFilterCategory("ALL")}>🏪 Barchasi</button>
          {CATEGORIES.map((cat) => (<button key={cat.value} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterCategory === cat.value ? "bg-primary-500 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`} onClick={() => setFilterCategory(cat.value)}>{cat.icon} {cat.label}</button>))}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div> : filtered.length === 0 ? <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center"><p className="text-4xl mb-3">📦</p><p className="text-gray-500 dark:text-gray-400">Mahsulot topilmadi</p></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => {
            const catInfo = CATEGORIES.find(c => c.value === p.category) || CATEGORIES[0];
            return (
              <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                <div className="h-24 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center relative">
                  <span className="text-4xl">{catInfo.icon}</span>
                  <div className="absolute top-2 left-2"><span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-semibold border border-gray-200 dark:border-gray-600">{catInfo.icon} {catInfo.label}</span></div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={() => openEdit(p)} className="w-7 h-7 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-xs hover:scale-110 transition-transform">✏️</button>
                    <button onClick={() => setDeleteConfirm(p)} className="w-7 h-7 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-xs hover:scale-110 transition-transform">🗑️</button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{p.name}</h3>
                  {p.company && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{p.company.name}</p>}
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(p.price)}</p>
                  {p.tags && p.tags.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{p.tags.map((tag: string, i: number) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">#{tag}</span>)}</div>}
                  {p.isBottle && <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 inline-block">🫙 Baxla</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={isCreateOpen} onClose={() => { setIsCreateOpen(false); resetForm(); }} title="Yangi Shablon Mahsulot"><ProductForm onSubmit={handleCreate} buttonText="Qo'shish" /></Modal>
      <Modal open={!!editProduct} onClose={() => { setEditProduct(null); resetForm(); }} title={`Tahrirlash: ${editProduct?.name || ""}`}><ProductForm onSubmit={handleEdit} buttonText="Saqlash" /></Modal>
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="O'chirish">{deleteConfirm && <div className="space-y-4"><div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800"><p className="text-sm text-red-700 dark:text-red-300">⚠️ <strong>{deleteConfirm.name}</strong> o'chiriladi!</p></div><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setDeleteConfirm(null)}>Bekor</Button><Button variant="destructive" onClick={handleDelete} disabled={formLoading}>{formLoading ? "..." : "O'chirish"}</Button></div></div>}</Modal>
    </div>
  );
}
