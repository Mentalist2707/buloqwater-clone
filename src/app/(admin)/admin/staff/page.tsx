"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatPhone, formatDateOnly } from "@/lib/utils";
import { getStaff, createStaff, toggleStaffStatus, updateStaffMember } from "@/actions/staff-actions";

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"ALL" | "OPERATOR" | "DRIVER">("ALL");
  const [createForm, setCreateForm] = useState({ name: "", phone: "", password: "", role: "OPERATOR" as "OPERATOR" | "DRIVER" });
  const [editForm, setEditForm] = useState({ name: "", phone: "", password: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const loadStaff = async () => { setLoading(true); const r = await getStaff(); if (r.success && r.data) setStaff(r.data as any); setLoading(false); };
  useEffect(() => { loadStaff(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true); setFormError("");
    const r = await createStaff({ name: createForm.name, phone: createForm.phone.startsWith("+") ? createForm.phone : `+998${createForm.phone}`, password: createForm.password, role: createForm.role });
    if (r.success) { setIsCreateOpen(false); setCreateForm({ name: "", phone: "", password: "", role: "OPERATOR" }); loadStaff(); showToast("Xodim qo'shildi!"); }
    else setFormError(r.error);
    setFormLoading(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editUser) return;
    setFormLoading(true); setFormError("");
    const r = await updateStaffMember(editUser.id, {
      name: editForm.name,
      phone: editForm.phone,
      ...(editForm.password ? { password: editForm.password } : {}),
    });
    if (r.success) { setEditUser(null); loadStaff(); showToast("Xodim yangilandi!"); }
    else setFormError(r.error);
    setFormLoading(false);
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    setEditForm({ name: user.name, phone: user.phone, password: "" });
    setFormError("");
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleStaffStatus(id);
    loadStaff();
    showToast(isActive ? "Xodim nofaol qilindi" : "Xodim faollashtirildi");
  };

  const filtered = staff.filter((s) => {
    if (filterRole !== "ALL" && s.role !== filterRole) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.phone.includes(search)) return false;
    return true;
  });

  const operators = filtered.filter((s) => s.role === "OPERATOR");
  const drivers = filtered.filter((s) => s.role === "DRIVER");

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-800 shadow-lg">
          <p className="text-sm font-medium">✅ {toast}</p>
        </div>
      )}

      <PageHeader
        title="Xodimlar"
        description={`Jami ${staff.length} ta xodim`}
        action={<Button onClick={() => setIsCreateOpen(true)}>+ Yangi Xodim</Button>}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Ism yoki telefon..." className="max-w-xs" />
        <div className="flex items-center gap-2">
          {(["ALL", "OPERATOR", "DRIVER"] as const).map((role) => (
            <button
              key={role}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterRole === role ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              onClick={() => setFilterRole(role)}
            >
              {role === "ALL" ? "Barchasi" : role === "OPERATOR" ? "☎️ Operatorlar" : "🚚 Haydovchilar"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-8">
          {/* Operatorlar */}
          {(filterRole === "ALL" || filterRole === "OPERATOR") && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>☎️</span> Operatorlar <Badge variant="secondary">{operators.length}</Badge>
              </h3>
              {operators.length === 0 ? (
                <div className="bg-white rounded-xl border p-6 text-center text-gray-500 text-sm">Operator topilmadi</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {operators.map((s) => (
                    <StaffCard key={s.id} user={s} onEdit={() => openEdit(s)} onToggle={() => handleToggle(s.id, s.isActive)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Haydovchilar */}
          {(filterRole === "ALL" || filterRole === "DRIVER") && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>🚚</span> Haydovchilar <Badge variant="secondary">{drivers.length}</Badge>
              </h3>
              {drivers.length === 0 ? (
                <div className="bg-white rounded-xl border p-6 text-center text-gray-500 text-sm">Haydovchi topilmadi</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {drivers.map((s) => (
                    <StaffCard key={s.id} user={s} onEdit={() => openEdit(s)} onToggle={() => handleToggle(s.id, s.isActive)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Yangi Xodim */}
      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Yangi Xodim Qo'shish">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{formError}</div>}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ism familiya</label><Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Jasur Eshmatov" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqami</label><Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="+998903333333" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Parol</label><Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Kamida 6 ta belgi" required minLength={6} /></div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lavozimi</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className={`py-4 rounded-xl text-sm font-medium border-2 transition-all ${createForm.role === "OPERATOR" ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 hover:border-gray-300"}`} onClick={() => setCreateForm({ ...createForm, role: "OPERATOR" })}>
                <span className="text-2xl block mb-1">☎️</span>Operator
              </button>
              <button type="button" className={`py-4 rounded-xl text-sm font-medium border-2 transition-all ${createForm.role === "DRIVER" ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 hover:border-gray-300"}`} onClick={() => setCreateForm({ ...createForm, role: "DRIVER" })}>
                <span className="text-2xl block mb-1">🚚</span>Haydovchi
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Bekor</Button><Button type="submit" disabled={formLoading}>{formLoading ? "Saqlanmoqda..." : "Qo'shish"}</Button></div>
        </form>
      </Modal>

      {/* Modal: Tahrirlash */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`Tahrirlash: ${editUser?.name || ""}`}>
        <form onSubmit={handleEdit} className="space-y-4">
          {formError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{formError}</div>}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ism familiya</label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Yangi parol (ixtiyoriy)</label><Input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Bo'sh qoldiring = o'zgarmaydi" minLength={6} /></div>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setEditUser(null)}>Bekor</Button><Button type="submit" disabled={formLoading}>{formLoading ? "..." : "Saqlash"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}

// ── Staff Card ────────────────────────────────────────────────
function StaffCard({ user, onEdit, onToggle }: { user: any; onEdit: () => void; onToggle: () => void }) {
  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${!user.isActive ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold ${user.isActive ? (user.role === "DRIVER" ? "bg-green-500" : "bg-blue-500") : "bg-gray-400"}`}>
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{formatPhone(user.phone)}</p>
          </div>
        </div>
        <Badge variant={user.isActive ? "success" : "destructive"} className="text-[10px]">
          {user.isActive ? "Faol" : "Nofaol"}
        </Badge>
      </div>

      {/* KPI (haydovchilar uchun) */}
      {user.kpi && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Bugungi KPI</span>
            <span className="font-medium text-gray-700">{user.kpi.delivered}/{user.kpi.assigned}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${user.kpi.assigned > 0 && user.kpi.delivered / user.kpi.assigned >= 0.8 ? "bg-green-500" : "bg-yellow-500"}`}
              style={{ width: `${user.kpi.assigned > 0 ? (user.kpi.delivered / user.kpi.assigned) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Qo'shilgan vaqt */}
      <p className="text-[10px] text-gray-400 mb-3">Qo'shilgan: {formatDateOnly(user.createdAt)}</p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>✏️ Tahrirlash</Button>
        <Button variant={user.isActive ? "destructive" : "success"} size="sm" className="flex-1" onClick={onToggle}>
          {user.isActive ? "O'chirish" : "Yoqish"}
        </Button>
      </div>
    </div>
  );
}
