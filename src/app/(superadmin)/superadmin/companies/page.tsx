"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDateOnly, formatPhone } from "@/lib/utils";
import { createCompany, getCompanies, toggleCompanyStatus } from "@/actions/company-actions";

interface Company {
  id: string;
  name: string;
  subdomain: string;
  status: "ACTIVE" | "SUSPENDED";
  phone: string | null;
  createdAt: string;
  director: { id: string; name: string; phone: string } | null;
  _count: { users: number; customers: number; orders: number };
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ companyName: "", subdomain: "", directorName: "", directorPhone: "", directorPassword: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const loadCompanies = async () => {
    setLoading(true);
    const result = await getCompanies();
    if (result.success && result.data) setCompanies(result.data as any);
    setLoading(false);
  };

  useEffect(() => { loadCompanies(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    const result = await createCompany({
      companyName: formData.companyName,
      subdomain: formData.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ""),
      directorName: formData.directorName,
      directorPhone: formData.directorPhone.startsWith("+") ? formData.directorPhone : `+998${formData.directorPhone}`,
      directorPassword: formData.directorPassword,
    });
    if (result.success) {
      setIsModalOpen(false);
      setFormData({ companyName: "", subdomain: "", directorName: "", directorPhone: "", directorPassword: "" });
      loadCompanies();
    } else {
      setFormError(result.error);
    }
    setFormLoading(false);
  };

  return (
    <div>
      <PageHeader title="Kompaniyalar" description="Barcha ro'yxatdan o'tgan kompaniyalar" action={<Button onClick={() => setIsModalOpen(true)}>+ Yangi Kompaniya</Button>} />

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Kompaniya</TableHead><TableHead>Subdomen</TableHead><TableHead>Direktor</TableHead><TableHead>Holat</TableHead><TableHead>Sana</TableHead><TableHead className="text-right">Amal</TableHead></TableRow></TableHeader>
          <TableBody>
            {companies.map((c) => (
              <TableRow key={c.id}>
                <TableCell><p className="font-medium">{c.name}</p></TableCell>
                <TableCell><code className="text-xs bg-gray-100 px-2 py-1 rounded">{c.subdomain}.buloqwater.uz</code></TableCell>
                <TableCell>{c.director ? <p className="text-sm">{c.director.name}</p> : <span className="text-gray-400">—</span>}</TableCell>
                <TableCell><Badge variant={c.status === "ACTIVE" ? "success" : "destructive"}>{c.status === "ACTIVE" ? "Faol" : "Muzlatilgan"}</Badge></TableCell>
                <TableCell className="text-gray-500">{formatDateOnly(c.createdAt)}</TableCell>
                <TableCell className="text-right"><Button variant={c.status === "ACTIVE" ? "destructive" : "success"} size="sm" onClick={() => { toggleCompanyStatus(c.id); loadCompanies(); }}>{c.status === "ACTIVE" ? "Muzlatish" : "Faollashtirish"}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yangi Kompaniya">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{formError}</div>}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Kompaniya nomi</label><Input value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Subdomen</label><div className="flex items-center gap-2"><Input value={formData.subdomain} onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} required /><span className="text-sm text-gray-500">.buloqwater.uz</span></div></div>
          <hr /><p className="text-sm font-medium text-gray-600">Direktor</p>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ismi</label><Input value={formData.directorName} onChange={(e) => setFormData({ ...formData, directorName: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefoni</label><Input value={formData.directorPhone} onChange={(e) => setFormData({ ...formData, directorPhone: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Parol</label><Input type="password" value={formData.directorPassword} onChange={(e) => setFormData({ ...formData, directorPassword: e.target.value })} required minLength={6} /></div>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Bekor</Button><Button type="submit" disabled={formLoading}>{formLoading ? "Saqlanmoqda..." : "Saqlash"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
