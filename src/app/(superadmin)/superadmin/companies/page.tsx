"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDateOnly, formatPhone } from "@/lib/utils";
import {
  createCompany,
  getCompanies,
  toggleCompanyStatus,
  updateCompany,
  extendSubscription,
} from "@/actions/company-actions";

interface Company {
  id: string;
  name: string;
  subdomain: string;
  status: "ACTIVE" | "SUSPENDED";
  phone: string | null;
  maxCustomers: number;
  maxUsers: number;
  createdAt: string;
  director: { id: string; name: string; phone: string } | null;
  _count: { users: number; customers: number; orders: number };
  subscription: { endDate: string; isPaid: boolean; amount: number } | null;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [subscriptionCompany, setSubscriptionCompany] = useState<Company | null>(null);
  const [settingsCompany, setSettingsCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create form
  const [createForm, setCreateForm] = useState({ companyName: "", subdomain: "", directorName: "", directorPhone: "", directorPassword: "" });
  // Edit form
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "" });
  // Subscription form
  const [subForm, setSubForm] = useState({ months: "1", amount: "" });
  // Settings form
  const [settingsForm, setSettingsForm] = useState({ maxCustomers: "500", maxUsers: "20" });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const loadCompanies = async () => {
    setLoading(true);
    const result = await getCompanies();
    if (result.success && result.data) setCompanies(result.data as any);
    setLoading(false);
  };

  useEffect(() => { loadCompanies(); }, []);

  const filteredCompanies = companies.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.subdomain.includes(search.toLowerCase())
  );

  // Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true); setFormError("");
    const result = await createCompany({
      companyName: createForm.companyName,
      subdomain: createForm.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ""),
      directorName: createForm.directorName,
      directorPhone: createForm.directorPhone.startsWith("+") ? createForm.directorPhone : `+998${createForm.directorPhone}`,
      directorPassword: createForm.directorPassword,
    });
    if (result.success) { setIsCreateOpen(false); setCreateForm({ companyName: "", subdomain: "", directorName: "", directorPhone: "", directorPassword: "" }); loadCompanies(); }
    else setFormError(result.error);
    setFormLoading(false);
  };

  // Edit
  const openEdit = (c: Company) => { setEditCompany(c); setEditForm({ name: c.name, phone: c.phone || "", address: "" }); };
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editCompany) return;
    setFormLoading(true); setFormError("");
    const result = await updateCompany(editCompany.id, { name: editForm.name, phone: editForm.phone });
    if (result.success) { setEditCompany(null); loadCompanies(); } else setFormError(result.error);
    setFormLoading(false);
  };

  // Subscription
  const openSubscription = (c: Company) => { setSubscriptionCompany(c); setSubForm({ months: "1", amount: "" }); };
  const handleExtendSub = async (e: React.FormEvent) => {
    e.preventDefault(); if (!subscriptionCompany) return;
    setFormLoading(true); setFormError("");
    const result = await extendSubscription(subscriptionCompany.id, parseInt(subForm.months), parseFloat(subForm.amount || "0"));
    if (result.success) { setSubscriptionCompany(null); loadCompanies(); } else setFormError(result.error);
    setFormLoading(false);
  };

  // Settings
  const openSettings = (c: Company) => { setSettingsCompany(c); setSettingsForm({ maxCustomers: c.maxCustomers.toString(), maxUsers: c.maxUsers.toString() }); };
  const handleSettings = async (e: React.FormEvent) => {
    e.preventDefault(); if (!settingsCompany) return;
    setFormLoading(true);
    const result = await updateCompany(settingsCompany.id, { maxCustomers: parseInt(settingsForm.maxCustomers), maxUsers: parseInt(settingsForm.maxUsers) });
    if (result.success) { setSettingsCompany(null); loadCompanies(); }
    setFormLoading(false);
  };

  const getDaysLeft = (sub: Company["subscription"]) => {
    if (!sub) return null;
    return Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86400000);
  };

  return (
    <div>
      <PageHeader
        title="Kompaniyalar"
        description={`Jami ${companies.length} ta kompaniya`}
        action={<Button onClick={() => setIsCreateOpen(true)}>+ Yangi Kompaniya</Button>}
      />

      {/* Qidiruv va Filtrlar */}
      <div className="flex items-center gap-4 mb-6">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Kompaniya nomi yoki subdomen..."
          className="max-w-sm"
        />
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="success">{companies.filter(c => c.status === "ACTIVE").length} faol</Badge>
          <Badge variant="destructive">{companies.filter(c => c.status === "SUSPENDED").length} muzlatilgan</Badge>
        </div>
      </div>

      {/* Jadval */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kompaniya</TableHead>
              <TableHead>Direktor</TableHead>
              <TableHead>Obuna</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Statistika</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">Kompaniya topilmadi</TableCell></TableRow>
            ) : (
              filteredCompanies.map((company) => {
                const daysLeft = getDaysLeft(company.subscription);
                return (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                          {company.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{company.name}</p>
                          <code className="text-xs text-gray-500">{company.subdomain}.buloqwater.uz</code>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.director ? (
                        <div><p className="text-sm">{company.director.name}</p><p className="text-xs text-gray-500">{formatPhone(company.director.phone)}</p></div>
                      ) : <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>
                      {daysLeft !== null ? (
                        <div>
                          <Badge variant={daysLeft > 7 ? "success" : daysLeft > 0 ? "warning" : "destructive"}>
                            {daysLeft > 0 ? `${daysLeft} kun qoldi` : `${Math.abs(daysLeft)} kun o'tgan`}
                          </Badge>
                          {company.subscription && (
                            <p className="text-xs text-gray-500 mt-1">
                              {company.subscription.isPaid ? "✅ To'langan" : "❌ To'lanmagan"}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Obuna yo'q</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.status === "ACTIVE" ? "success" : "destructive"}>
                        {company.status === "ACTIVE" ? "Faol" : "Muzlatilgan"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <p>👥 {company._count.users} xodim</p>
                        <p>🧑‍💼 {company._count.customers} mijoz</p>
                        <p>📦 {company._count.orders} buyurtma</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(company)} title="Tahrirlash">✏️</Button>
                          <Button variant="ghost" size="sm" onClick={() => openSubscription(company)} title="Obuna">📅</Button>
                          <Button variant="ghost" size="sm" onClick={() => openSettings(company)} title="Sozlamalar">⚙️</Button>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant={company.status === "ACTIVE" ? "destructive" : "success"}
                            size="sm"
                            onClick={async () => { await toggleCompanyStatus(company.id); loadCompanies(); }}
                          >
                            {company.status === "ACTIVE" ? "Muzlatish" : "Faollashtirish"}
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}

      {/* Modal: Yangi Kompaniya */}
      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Yangi Kompaniya Qo'shish">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{formError}</div>}
          <div><label className="block text-sm font-medium mb-1">Kompaniya nomi</label><Input value={createForm.companyName} onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })} placeholder="Shifo Suv MChJ" required /></div>
          <div><label className="block text-sm font-medium mb-1">Subdomen</label><div className="flex items-center gap-2"><Input value={createForm.subdomain} onChange={(e) => setCreateForm({ ...createForm, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="shifo" required /><span className="text-sm text-gray-500 whitespace-nowrap">.buloqwater.uz</span></div></div>
          <hr className="border-gray-100" />
          <p className="text-sm font-medium text-gray-600">Direktor</p>
          <div><label className="block text-sm font-medium mb-1">Ismi</label><Input value={createForm.directorName} onChange={(e) => setCreateForm({ ...createForm, directorName: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium mb-1">Telefoni</label><Input value={createForm.directorPhone} onChange={(e) => setCreateForm({ ...createForm, directorPhone: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium mb-1">Parol</label><Input type="password" value={createForm.directorPassword} onChange={(e) => setCreateForm({ ...createForm, directorPassword: e.target.value })} required minLength={6} /></div>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Bekor</Button><Button type="submit" disabled={formLoading}>{formLoading ? "Saqlanmoqda..." : "Yaratish"}</Button></div>
        </form>
      </Modal>

      {/* Modal: Tahrirlash */}
      <Modal open={!!editCompany} onClose={() => setEditCompany(null)} title={`Tahrirlash: ${editCompany?.name || ""}`}>
        <form onSubmit={handleEdit} className="space-y-4">
          {formError && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{formError}</div>}
          <div><label className="block text-sm font-medium mb-1">Kompaniya nomi</label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium mb-1">Telefon</label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setEditCompany(null)}>Bekor</Button><Button type="submit" disabled={formLoading}>{formLoading ? "..." : "Saqlash"}</Button></div>
        </form>
      </Modal>

      {/* Modal: Obuna */}
      <Modal open={!!subscriptionCompany} onClose={() => setSubscriptionCompany(null)} title={`Obuna: ${subscriptionCompany?.name || ""}`}>
        <form onSubmit={handleExtendSub} className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              {subscriptionCompany?.subscription
                ? `Hozirgi muddat: ${formatDateOnly(subscriptionCompany.subscription.endDate)}`
                : "Obuna hali qo'shilmagan"}
            </p>
          </div>
          <div><label className="block text-sm font-medium mb-1">Necha oy qo'shish?</label>
            <div className="grid grid-cols-4 gap-2">
              {["1", "3", "6", "12"].map((m) => (
                <button key={m} type="button" className={`py-3 rounded-lg text-sm font-medium border-2 transition-all ${subForm.months === m ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200"}`} onClick={() => setSubForm({ ...subForm, months: m })}>{m} oy</button>
              ))}
            </div>
          </div>
          <div><label className="block text-sm font-medium mb-1">To'lov summasi (so'm)</label><Input type="number" value={subForm.amount} onChange={(e) => setSubForm({ ...subForm, amount: e.target.value })} placeholder="500000" /></div>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setSubscriptionCompany(null)}>Bekor</Button><Button type="submit" variant="success" disabled={formLoading}>{formLoading ? "..." : "Muddat qo'shish"}</Button></div>
        </form>
      </Modal>

      {/* Modal: Sozlamalar */}
      <Modal open={!!settingsCompany} onClose={() => setSettingsCompany(null)} title={`Sozlamalar: ${settingsCompany?.name || ""}`}>
        <form onSubmit={handleSettings} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Maksimal mijozlar soni</label><Input type="number" value={settingsForm.maxCustomers} onChange={(e) => setSettingsForm({ ...settingsForm, maxCustomers: e.target.value })} min={1} /></div>
          <div><label className="block text-sm font-medium mb-1">Maksimal xodimlar soni</label><Input type="number" value={settingsForm.maxUsers} onChange={(e) => setSettingsForm({ ...settingsForm, maxUsers: e.target.value })} min={1} /></div>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setSettingsCompany(null)}>Bekor</Button><Button type="submit" disabled={formLoading}>{formLoading ? "..." : "Saqlash"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
