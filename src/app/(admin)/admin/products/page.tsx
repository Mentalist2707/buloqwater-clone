"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency } from "@/lib/utils";
import { getProducts, createProduct, updateProductPrice } from "@/actions/product-actions";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", description: "", price: "", isBottle: true });
  const [editPrice, setEditPrice] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const loadProducts = async () => { setLoading(true); const r = await getProducts(); if (r.success && r.data) setProducts(r.data as any); setLoading(false); };
  useEffect(() => { loadProducts(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true); setFormError("");
    const r = await createProduct({ name: formData.name, description: formData.description || undefined, price: parseFloat(formData.price), isBottle: formData.isBottle });
    if (r.success) { setIsModalOpen(false); setFormData({ name: "", description: "", price: "", isBottle: true }); loadProducts(); } else setFormError(r.error);
    setFormLoading(false);
  };

  const handlePriceUpdate = async () => {
    if (!editingProduct) return;
    setFormLoading(true);
    await updateProductPrice(editingProduct.id, parseFloat(editPrice));
    setEditingProduct(null); loadProducts();
    setFormLoading(false);
  };

  return (
    <div>
      <PageHeader title="Mahsulotlar" description="Suv turlari va narxlari" action={<Button onClick={() => setIsModalOpen(true)}>+ Yangi Mahsulot</Button>} />
      {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3"><div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl">{p.isBottle ? "🫙" : "💧"}</div><div><h3 className="font-semibold">{p.name}</h3>{p.description && <p className="text-xs text-gray-500">{p.description}</p>}</div></div>
              <div className="flex items-center justify-between"><p className="text-xl font-bold">{formatCurrency(p.price)}</p><Button variant="outline" size="sm" onClick={() => { setEditingProduct(p); setEditPrice(p.price.toString()); }}>Narxni o'zgartirish</Button></div>
            </div>
          ))}
        </div>
      )}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yangi Mahsulot">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{formError}</div>}
          <div><label className="block text-sm font-medium mb-1">Nomi</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium mb-1">Tavsif</label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          <div><label className="block text-sm font-medium mb-1">Narxi (so'm)</label><Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required min={0} /></div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={formData.isBottle} onChange={(e) => setFormData({ ...formData, isBottle: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm">Baxla hisoblansin</span></label>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Bekor</Button><Button type="submit" disabled={formLoading}>{formLoading ? "..." : "Saqlash"}</Button></div>
        </form>
      </Modal>
      <Modal open={!!editingProduct} onClose={() => setEditingProduct(null)} title="Narxni o'zgartirish">
        <div className="space-y-4"><Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} /><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setEditingProduct(null)}>Bekor</Button><Button onClick={handlePriceUpdate} disabled={formLoading}>Saqlash</Button></div></div>
      </Modal>
    </div>
  );
}
