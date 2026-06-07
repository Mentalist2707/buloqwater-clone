"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatPhone, formatCurrency } from "@/lib/utils";
import { getCustomers, createCustomer } from "@/actions/customer-actions";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({ name: "", phone1: "", phone2: "", address: "", landmark: "", locationLink: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const loadCustomers = async (s?: string) => { setLoading(true); const r = await getCustomers(s); if (r.success && r.data) setCustomers(r.data as any); setLoading(false); };
  useEffect(() => { loadCustomers(); }, []);

  const handleSearch = (v: string) => { setSearch(v); if (v.length >= 2 || v.length === 0) loadCustomers(v || undefined); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true); setFormError("");
    const r = await createCustomer({ name: formData.name, phone1: formData.phone1.startsWith("+") ? formData.phone1 : `+998${formData.phone1}`, phone2: formData.phone2 ? (formData.phone2.startsWith("+") ? formData.phone2 : `+998${formData.phone2}`) : undefined, address: formData.address, landmark: formData.landmark || undefined, locationLink: formData.locationLink || undefined });
    if (r.success) { setIsModalOpen(false); setFormData({ name: "", phone1: "", phone2: "", address: "", landmark: "", locationLink: "" }); loadCustomers(); } else setFormError(r.error);
    setFormLoading(false);
  };

  return (
    <div>
      <PageHeader title="Mijozlar Bazasi" action={<Button onClick={() => setIsModalOpen(true)}>+ Yangi Mijoz</Button>} />
      <div className="mb-6"><Input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Ism, telefon yoki manzil bo'yicha qidiring..." className="max-w-md" /></div>
      {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div> : (
        <Table><TableHeader><TableRow><TableHead>Mijoz</TableHead><TableHead>Telefon</TableHead><TableHead>Manzil</TableHead><TableHead>Idish</TableHead><TableHead>Qarz</TableHead></TableRow></TableHeader><TableBody>
          {customers.map((c) => (<TableRow key={c.id}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{formatPhone(c.phone1)}</TableCell><TableCell className="max-w-[200px] truncate">{c.address}</TableCell><TableCell><Badge variant={c.bottleBalance > 0 ? "warning" : "secondary"}>{c.bottleBalance} ta</Badge></TableCell><TableCell>{c.debtBalance > 0 ? <span className="text-red-600 font-medium">{formatCurrency(c.debtBalance)}</span> : "—"}</TableCell></TableRow>))}
        </TableBody></Table>
      )}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yangi Mijoz">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{formError}</div>}
          <div><label className="block text-sm font-medium mb-1">Ism</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium mb-1">Telefon 1</label><Input value={formData.phone1} onChange={(e) => setFormData({ ...formData, phone1: e.target.value })} required /></div><div><label className="block text-sm font-medium mb-1">Telefon 2</label><Input value={formData.phone2} onChange={(e) => setFormData({ ...formData, phone2: e.target.value })} /></div></div>
          <div><label className="block text-sm font-medium mb-1">Manzil</label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium mb-1">Mo'ljal</label><Input value={formData.landmark} onChange={(e) => setFormData({ ...formData, landmark: e.target.value })} /></div>
          <div><label className="block text-sm font-medium mb-1">Lokatsiya linki</label><Input value={formData.locationLink} onChange={(e) => setFormData({ ...formData, locationLink: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Bekor</Button><Button type="submit" disabled={formLoading}>{formLoading ? "..." : "Saqlash"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
