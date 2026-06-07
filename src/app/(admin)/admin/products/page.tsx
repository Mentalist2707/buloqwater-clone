"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency } from "@/lib/utils";
import { getProducts, createProduct, updateProductPrice, updateProduct, toggleProductStatus } from "@/actions/product-actions";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [createForm, setCreateForm] = useState({ name: "", description: "", price: "", isBottle: true });
  const [editForm, setEditForm] = useState({ name: "", description: "", price: "", isBottle: true });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const loadProducts = async () => { setLoading(true); const r = await getProducts(); if (r.success && r.data) setProducts(r.data as any); setLoading(false); };
  useEffect(() => { loadProducts(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true); setFormError("");
    const r = await createProduct({ name: createForm.name, description: createForm.description || undefined, price: parseFloat(createForm.price), isBottle: createForm.isBottle });
    if (r.success) { setIsCreateOpen(false); setCreateForm({ name: "", description: "", price: "", isBottle: true }); loadProducts(); showToast("Mahsulot qo'shildi!"); }
    else setFormError(r.error);
    setFormLoading(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editProduct) return;
    setFormLoading(true); setFormError("");
    const r = await updateProduct(editProduct.id, { name: editForm.name, description: editForm.description, price: parseFloat(editForm.price), isBottle: editForm.isBottle });
    if (r.success) { setEditProduct(null); loadProducts(); showToast("Mahsulot yangilandi!"); }
    else setFormError(r.error);
    setFormLoading(false);
  };

  const openEdit = (p: any) => {
    setEditProduct(p);
    setEditForm({ name: p.name, description: p.description || "", price: p.price.toString(), isBottle: p.isBottle });
    setFormError("");
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    await toggleProductStatus(id);
    loadProducts();
    showToast(isActive ? "Mahsulot nofaol qilindi" : "Mahsulot faollashtirildi");
  };

  const activeProducts = products.filter((p) => p.isActive);
  const inactiveProducts = products.filter((p) => !p.isActive);

  return (
    <div className="relative">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-800 shadow-lg"><p className="text-sm font-medium">✅ {toast}</p></div>}

      <PageHeader title="Mahsulotlar" description={`${products.length} ta mahsulot`} action={<Button onClick={() => setIsCreateOpen(true)}>+ Yangi Mahsulot</Button>} />

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-6">
          {/* Active products */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl">
                        {p.isBottle ? "🫙" : "💧"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{p.name}</h3>
                        {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(p.price)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {p.isBottle && <Badge variant="default" className="text-[10px]">🫙 Baxla hisoblanadi</Badge>}
                        <Badge variant="success" className="text-[10px]">Faol</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-2 bg-gray-50/50">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(p)}>✏️ Tahrirlash</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(p.id, p.isActive)}>🚫</Button>
                </div>
              </div>
            ))}
          </div>

          {/* Inactive */}
          {inactiveProducts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Nofaol mahsulotlar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {inactiveProducts.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 opacity-60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{p.isBottle ? "🫙" : "💧"}</span>
                        <div><p className="text-sm font-medium text-gray-700">{p.name}</p><p className="text-xs text-gray-500">{formatCurrency(p.price)}</p></div>
                      </div>
                      <Button variant="success" size="sm" onClick={() => handleToggleStatus(p.id, p.isActive)}>Faollashtirish</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Yangi Mahsulot */}
      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Yangi Mahsulot">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{formError}</div>}
          <div><label className="block text-sm font-medium mb-1">Nomi</label><Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="19L Kumush Suv" required /></div>
          <div><label className="block text-sm font-medium mb-1">Tavsif (ixtiyoriy)</label><Input value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Toza tog' suvidan filtrlangan" /></div>
          <div><label className="block text-sm font-medium mb-1">Narxi (so'm)</label><Input type="number" value={createForm.price} onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })} placeholder="15000" required min={0} /></div>
          <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={createForm.isBottle} onChange={(e) => setCreateForm({ ...createForm, isBottle: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
            <div><p className="text-sm font-medium text-gray-700">🫙 Baxla (idish) hisoblansin</p><p className="text-xs text-gray-500">Bu mahsulot buyurtmasida idish hisobi yuritiladi</p></div>
          </label>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Bekor</Button><Button type="submit" disabled={formLoading}>{formLoading ? "..." : "Qo'shish"}</Button></div>
        </form>
      </Modal>

      {/* Modal: Tahrirlash */}
      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title={`Tahrirlash: ${editProduct?.name || ""}`}>
        <form onSubmit={handleEdit} className="space-y-4">
          {formError && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{formError}</div>}
          <div><label className="block text-sm font-medium mb-1">Nomi</label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium mb-1">Tavsif</label><Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
          <div><label className="block text-sm font-medium mb-1">Narxi (so'm)</label><Input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} required min={0} /></div>
          <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={editForm.isBottle} onChange={(e) => setEditForm({ ...editForm, isBottle: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-primary-500" />
            <span className="text-sm text-gray-700">🫙 Baxla hisoblansin</span>
          </label>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setEditProduct(null)}>Bekor</Button><Button type="submit" disabled={formLoading}>{formLoading ? "..." : "Saqlash"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
