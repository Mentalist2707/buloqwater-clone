"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateOnly, formatPhone } from "@/lib/utils";
import {
  createCompany, getCompanies, toggleCompanyStatus, updateCompany, extendSubscription,
} from "@/actions/company-actions";

interface Company {
  id: string; name: string; subdomain: string; status: "ACTIVE" | "SUSPENDED";
  phone: string | null; maxCustomers: number; maxUsers: number; createdAt: string;
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
  const [createForm, setCreateForm] = useState({ companyName: "", subdomain: "", directorName: "", directorPhone: "", directorPassword: "" });
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "" });
  const [subForm, setSubForm] = useState({ months: "1", amount: "" });
  const [settingsForm, setSettingsForm] = useState({ maxCustomers: "500", maxUsers: "20" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const loadCompanies = async () => { setLoading(true); const r = await getCompanies(); if (r.success && r.data) setCompanies(r.data as any); setLoading(false); };
  useEffect(() => { loadCompanies(); }, []);

  const filtered = companies.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.subdomain.includes(search.toLowerCase()));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true); setFormError("");
    const r = await createCompany({ companyName: createForm.companyName, subdomain: createForm.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ""), directorName: createForm.directorName, directorPhone: createForm.directorPhone.startsWith("+") ? createForm.directorPhone : `+998${createForm.directorPhone}`, directorPassword: createForm.directorPassword });
    if (r.success) { setIsCreateOpen(false); setCreateForm({ companyName: "", subdomain: "", directorName: "", directorPhone: "", directorPassword: "" }); loadCompanies(); showToast("Kompaniya yaratildi!"); }
    else setFormError(r.error);
    setFormLoading(false);
  };

  const openEdit = (c: Company) => { setEditCompany(c); setEditForm({ name: c.name, phone: c.phone || "", address: "" }); setFormError(""); };
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editCompany) return; setFormLoading(true); setFormError("");
    const r = await updateCompany(editCompany.id, { name: editForm.name, phone: editForm.phone });
    if (r.success) { setEditCompany(null); loadCompanies(); showToast("Yangilandi!"); } else setFormError(r.error);
    setFormLoading(false);
  };

  const openSubscription = (c: Company) => { setSubscriptionCompany(c); setSubForm({ months: "1", amount: "" }); setFormError(""); };
  const handleExtendSub = async (e: React.FormEvent) => {
    e.preventDefault(); if (!subscriptionCompany) return; setFormLoading(true); setFormError("");
    const r = await extendSubscription(subscriptionCompany.id, parseInt(subForm.months), parseFloat(subForm.amount || "0"));
    if (r.success) { setSubscriptionCompany(null); loadCompanies(); showToast("Obuna uzaytirildi!"); } else setFormError(r.error);
    setFormLoading(false);
  };

  const openSettings = (c: Company) => { setSettingsCompany(c); setSettingsForm({ maxCustomers: c.maxCustomers.toString(), maxUsers: c.maxUsers.toString() }); };
  const handleSettings = async (e: React.FormEvent) => {
    e.preventDefault(); if (!settingsCompany) return; setFormLoading(true);
    const r = await updateCompany(settingsCompany.id, { maxCustomers: parseInt(settingsForm.maxCustomers), maxUsers: parseInt(settingsForm.maxUsers) });
    if (r.success) { setSettingsCompany(null); loadCompanies(); showToast("Sozlamalar saqlandi!"); }
    setFormLoading(false);
  };

  const getDaysLeft = (sub: Company["subscription"]) => { if (!sub) return null; return Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86400000); };

  return (
    <div className="relative">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 shadow-lg animate-in"><p className="text-sm font-medium">✅ {toast}</p></div>}

      <PageHeader title="Kompaniyalar" description={`Jami ${companies.length} ta kompaniya`} action={<Button onClick={() => setIsCreateOpen(true)}>+ Yangi Kompaniya</Button>} />

      {/* Search + Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Kompaniya nomi yoki subdomen..." className="max-w-sm" />
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="success">{companies.filter(c => c.status === "ACTIVE").length} faol</Badge>
          <Badge variant="destructive">{companies.filter(c => c.status === "SUSPENDED").length} muzlatilgan</Badge>
        </div>
      </div>

      {/* Companies Grid — Card layout (responsive + dark) */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">🏢</p>
          <p className="text-gray-500 dark:text-gray-400">Kompaniya topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((company) => {
            const daysLeft = getDaysLeft(company.subscription);
            return (
              <div key={company.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Header - link to stats */}
                <Link href={`/superadmin/companies/${company.id}`} className="block p-5 pb-3 hover:bg-gray-50/30 dark:hover:bg-gray-700/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-lg">
                        {company.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{company.name}</p>
                        <code className="text-xs text-gray-500 dark:text-gray-400">{company.subdomain}.buloqwater.uz</code>
                      </div>
                    </div>
                    <Badge variant={company.status === "ACTIVE" ? "success" : "destructive"}>
                      {company.status === "ACTIVE" ? "Faol" : "Muzlatilgan"}
                    </Badge>
                  </div>
                </Link>
                <div className="px-5 pb-4 space-y-2">
                  {/* Direktor */}
                  {company.director && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400 dark:text-gray-500">👤</span>
                      <span className="text-gray-700 dark:text-gray-300">{company.director.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{formatPhone(company.director.phone)}</span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>👥 {company._count.users}</span>
                    <span>🧑‍💼 {company._count.customers}</span>
                    <span>📦 {company._count.orders}</span>
                  </div>

                  {/* Obuna */}
                  <div className="flex items-center gap-2">
                    {daysLeft !== null ? (
                      <>
                        <Badge variant={daysLeft > 7 ? "success" : daysLeft > 0 ? "warning" : "destructive"}>
                          {daysLeft > 0 ? `${daysLeft} kun` : `${Math.abs(daysLeft)} kun o'tgan`}
                        </Badge>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {company.subscription?.isPaid ? "✅" : "❌"}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">Obuna yo'q</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between bg-gray-50/50 dark:bg-gray-700/30">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(company)} title="Tahrirlash">✏️</Button>
                    <Button variant="ghost" size="sm" onClick={() => openSubscription(company)} title="Obuna">📅</Button>
                    <Button variant="ghost" size="sm" onClick={() => openSettings(company)} title="Sozlamalar">⚙️</Button>
                  </div>
                  <Button
                    variant={company.status === "ACTIVE" ? "destructive" : "success"}
                    size="sm"
                    onClick={async () => { await toggleCompanyStatus(company.id); loadCompanies(); showToast(company.status === "ACTIVE" ? "Muzlatildi" : "Faollashtirildi"); }}
                  >
                    {company.status === "ACTIVE" ? "Muzlatish" : "Faollashtirish"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ MODALS ═══ */}

      {/* Yangi Kompaniya */}
      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Yangi Kompaniya Qo'shish">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">{formError}</div>}
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kompaniya nomi</label><Input value={createForm.companyName} onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })} placeholder="Shifo Suv MChJ" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subdomen</label><div className="flex items-center gap-2"><Input value={createForm.subdomain} onChange={(e) => setCreateForm({ ...createForm, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="shifo" required /><span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">.buloqwater.uz</span></div></div>
          <hr className="border-gray-100 dark:border-gray-700" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Direktor ma'lumotlari</p>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ismi</label><Input value={createForm.directorName} onChange={(e) => setCreateForm({ ...createForm, directorName: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefoni</label><Input value={createForm.directorPhone} onChange={(e) => setCreateForm({ ...createForm, directorPhone: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parol</label><Input type="password" value={createForm.directorPassword} onChange={(e) => setCreateForm({ ...createForm, directorPassword: e.target.value })} required minLength={6} /></div>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Bekor</Button><Button type="submit" disabled={formLoading}>{formLoading ? "Saqlanmoqda..." : "Yaratish"}</Button></div>
        </form>
      </Modal>

      {/* Tahrirlash */}
      <Modal open={!!editCompany} onClose={() => setEditCompany(null)} title={`Tahrirlash: ${editCompany?.name || ""}`}>
        <form onSubmit={handleEdit} className="space-y-4">
          {formError && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">{formError}</div>}
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kompaniya nomi</label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon</label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setEditCompany(null)}>Bekor</Button><Button type="submit" disabled={formLoading}>{formLoading ? "..." : "Saqlash"}</Button></div>
        </form>
      </Modal>

      {/* Obuna */}
      <Modal open={!!subscriptionCompany} onClose={() => setSubscriptionCompany(null)} title={`Obuna: ${subscriptionCompany?.name || ""}`}>
        <form onSubmit={handleExtendSub} className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">{subscriptionCompany?.subscription ? `Hozirgi muddat: ${formatDateOnly(subscriptionCompany.subscription.endDate)}` : "Obuna hali qo'shilmagan"}</p>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Necha oy?</label><div className="grid grid-cols-4 gap-2">{["1","3","6","12"].map((m) => (<button key={m} type="button" className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${subForm.months === m ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300" : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"}`} onClick={() => setSubForm({ ...subForm, months: m })}>{m} oy</button>))}</div></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To'lov (so'm)</label><Input type="number" value={subForm.amount} onChange={(e) => setSubForm({ ...subForm, amount: e.target.value })} placeholder="500000" /></div>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setSubscriptionCompany(null)}>Bekor</Button><Button type="submit" variant="success" disabled={formLoading}>{formLoading ? "..." : "Muddat qo'shish"}</Button></div>
        </form>
      </Modal>

      {/* Sozlamalar */}
      <Modal open={!!settingsCompany} onClose={() => setSettingsCompany(null)} title={`Sozlamalar: ${settingsCompany?.name || ""}`}>
        <form onSubmit={handleSettings} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Maks. mijozlar</label><Input type="number" value={settingsForm.maxCustomers} onChange={(e) => setSettingsForm({ ...settingsForm, maxCustomers: e.target.value })} min={1} /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Maks. xodimlar</label><Input type="number" value={settingsForm.maxUsers} onChange={(e) => setSettingsForm({ ...settingsForm, maxUsers: e.target.value })} min={1} /></div>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setSettingsCompany(null)}>Bekor</Button><Button type="submit" disabled={formLoading}>{formLoading ? "..." : "Saqlash"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
