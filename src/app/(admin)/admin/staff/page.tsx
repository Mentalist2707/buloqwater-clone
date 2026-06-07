"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatPhone } from "@/lib/utils";
import { getStaff, createStaff, toggleStaffStatus } from "@/actions/staff-actions";

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", phone: "", password: "", role: "OPERATOR" as "OPERATOR" | "DRIVER" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const loadStaff = async () => { setLoading(true); const r = await getStaff(); if (r.success && r.data) setStaff(r.data as any); setLoading(false); };
  useEffect(() => { loadStaff(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true); setFormError("");
    const r = await createStaff({ name: formData.name, phone: formData.phone.startsWith("+") ? formData.phone : `+998${formData.phone}`, password: formData.password, role: formData.role });
    if (r.success) { setIsModalOpen(false); setFormData({ name: "", phone: "", password: "", role: "OPERATOR" }); loadStaff(); } else setFormError(r.error);
    setFormLoading(false);
  };

  const operators = staff.filter((s) => s.role === "OPERATOR");
  const drivers = staff.filter((s) => s.role === "DRIVER");

  return (
    <div>
      <PageHeader title="Xodimlar" description="Operatorlar va haydovchilar" action={<Button onClick={() => setIsModalOpen(true)}>+ Yangi Xodim</Button>} />
      {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div> : (
        <div className="space-y-8">
          <div><h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Operatorlar ({operators.length})</h3>
            <Table><TableHeader><TableRow><TableHead>Ism</TableHead><TableHead>Telefon</TableHead><TableHead>Holat</TableHead><TableHead className="text-right">Amal</TableHead></TableRow></TableHeader><TableBody>{operators.map((s) => (<TableRow key={s.id}><TableCell className="font-medium">{s.name}</TableCell><TableCell>{formatPhone(s.phone)}</TableCell><TableCell><Badge variant={s.isActive ? "success" : "destructive"}>{s.isActive ? "Faol" : "Nofaol"}</Badge></TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => { toggleStaffStatus(s.id); loadStaff(); }}>{s.isActive ? "O'chirish" : "Yoqish"}</Button></TableCell></TableRow>))}</TableBody></Table></div>
          <div><h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Haydovchilar ({drivers.length})</h3>
            <Table><TableHeader><TableRow><TableHead>Ism</TableHead><TableHead>Telefon</TableHead><TableHead>KPI</TableHead><TableHead>Holat</TableHead><TableHead className="text-right">Amal</TableHead></TableRow></TableHeader><TableBody>{drivers.map((s) => (<TableRow key={s.id}><TableCell className="font-medium">{s.name}</TableCell><TableCell>{formatPhone(s.phone)}</TableCell><TableCell>{s.kpi ? <span className="text-xs">{s.kpi.delivered}/{s.kpi.assigned}</span> : "—"}</TableCell><TableCell><Badge variant={s.isActive ? "success" : "destructive"}>{s.isActive ? "Faol" : "Nofaol"}</Badge></TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => { toggleStaffStatus(s.id); loadStaff(); }}>{s.isActive ? "O'chirish" : "Yoqish"}</Button></TableCell></TableRow>))}</TableBody></Table></div>
        </div>
      )}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yangi Xodim">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{formError}</div>}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ism</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Parol</label><Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Lavozim</label><div className="flex gap-3"><button type="button" className={`flex-1 py-3 rounded-lg text-sm font-medium border ${formData.role === "OPERATOR" ? "bg-primary-50 border-primary-300 text-primary-700" : "border-gray-200"}`} onClick={() => setFormData({ ...formData, role: "OPERATOR" })}>Operator</button><button type="button" className={`flex-1 py-3 rounded-lg text-sm font-medium border ${formData.role === "DRIVER" ? "bg-primary-50 border-primary-300 text-primary-700" : "border-gray-200"}`} onClick={() => setFormData({ ...formData, role: "DRIVER" })}>Haydovchi</button></div></div>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Bekor</Button><Button type="submit" disabled={formLoading}>{formLoading ? "Saqlanmoqda..." : "Saqlash"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
