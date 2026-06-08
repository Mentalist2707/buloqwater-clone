"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { formatPhone, getRoleLabel } from "@/lib/utils";
import { getAllUsers, blockUser, deleteUser, resetUserPassword } from "@/actions/superadmin-user-actions";

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [confirmModal, setConfirmModal] = useState<{ type: "block" | "delete" | "reset"; user: any } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };
  const loadUsers = async () => { setLoading(true); const r = await getAllUsers(); if (r.success && r.data) setUsers(r.data as any); setLoading(false); };
  useEffect(() => { loadUsers(); }, []);

  const handleAction = async () => {
    if (!confirmModal) return;
    setActionLoading(true);
    let result;
    if (confirmModal.type === "block") { result = await blockUser(confirmModal.user.id); if (result.success) showToast(confirmModal.user.isActive ? "Bloklandi" : "Faollashtirildi"); }
    else if (confirmModal.type === "delete") { result = await deleteUser(confirmModal.user.id); if (result.success) showToast("O'chirildi"); }
    else { result = await resetUserPassword(confirmModal.user.id); if (result.success) showToast("Parol tiklandi: 12345678bw"); }
    if (result && !result.success) showToast(result.error, "error");
    setConfirmModal(null); setActionLoading(false); loadUsers();
  };

  const filtered = users.filter((u) => {
    if (filterRole !== "ALL" && u.role !== filterRole) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.phone.includes(search)) return false;
    return true;
  });

  return (
    <div className="relative">
      {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border animate-in ${toast.type === "success" ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200" : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"}`}><p className="text-sm font-medium">{toast.type === "success" ? "✅" : "❌"} {toast.message}</p></div>}

      <PageHeader title="Foydalanuvchilar" description={`Jami ${users.length} ta`} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Ism yoki telefon..." className="max-w-xs" />
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["ALL", "DIRECTOR", "OPERATOR", "DRIVER", "CUSTOMER"].map((role) => (
            <button key={role} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filterRole === role ? "bg-primary-500 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`} onClick={() => setFilterRole(role)}>
              {role === "ALL" ? "Barchasi" : getRoleLabel(role)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center"><p className="text-4xl mb-3">👥</p><p className="text-gray-500 dark:text-gray-400">Topilmadi</p></div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <div className="col-span-3">Foydalanuvchi</div><div className="col-span-2">Telefon</div><div className="col-span-2">Rol</div><div className="col-span-2">Kompaniya</div><div className="col-span-1">Holat</div><div className="col-span-2 text-right">Amallar</div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {filtered.map((user) => (
              <div key={user.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors items-center">
                <div className="col-span-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${user.isActive ? "bg-primary-500" : "bg-gray-400"}`}>{user.name.charAt(0)}</div>
                  <div><p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p><p className="text-xs text-gray-500 dark:text-gray-400 md:hidden">{formatPhone(user.phone)}</p></div>
                </div>
                <div className="col-span-2 hidden md:block"><p className="text-sm text-gray-700 dark:text-gray-300">{formatPhone(user.phone)}</p></div>
                <div className="col-span-2"><Badge variant={user.role === "DIRECTOR" ? "default" : user.role === "OPERATOR" ? "secondary" : user.role === "DRIVER" ? "success" : "outline"}>{getRoleLabel(user.role)}</Badge></div>
                <div className="col-span-2 hidden md:block">{user.company ? <p className="text-sm text-gray-700 dark:text-gray-300">{user.company.name}</p> : <span className="text-xs text-gray-400">—</span>}</div>
                <div className="col-span-1"><Badge variant={user.isActive ? "success" : "destructive"}>{user.isActive ? "Faol" : "Blok"}</Badge></div>
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setConfirmModal({ type: "reset", user })} title="Parolni tiklash">🔑</Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmModal({ type: "block", user })} title={user.isActive ? "Bloklash" : "Faollashtirish"}>{user.isActive ? "🚫" : "✅"}</Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmModal({ type: "delete", user })} title="O'chirish" className="hover:bg-red-50 dark:hover:bg-red-900/20">🗑️</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700"><p className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} / {users.length} ta</p></div>
        </div>
      )}

      {/* Confirm Modal */}
      <Modal open={!!confirmModal} onClose={() => setConfirmModal(null)} title={confirmModal?.type === "block" ? (confirmModal.user.isActive ? "Bloklash" : "Faollashtirish") : confirmModal?.type === "delete" ? "O'chirish" : "Parol tiklash"}>
        {confirmModal && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold">{confirmModal.user.name.charAt(0)}</div>
              <div><p className="text-sm font-semibold text-gray-900 dark:text-white">{confirmModal.user.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{formatPhone(confirmModal.user.phone)} · {getRoleLabel(confirmModal.user.role)}</p></div>
            </div>
            {confirmModal.type === "delete" && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"><p className="text-sm text-red-700 dark:text-red-300 font-medium">⚠️ Bu amalni qaytarib bo'lmaydi!</p></div>}
            {confirmModal.type === "block" && <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl"><p className="text-sm text-yellow-700 dark:text-yellow-300">{confirmModal.user.isActive ? "🚫 Tizimga kira olmaydi" : "✅ Qayta kira oladi"}</p></div>}
            {confirmModal.type === "reset" && <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"><p className="text-sm text-blue-700 dark:text-blue-300">🔑 Yangi parol: <code className="font-bold bg-blue-100 dark:bg-blue-800 px-2 py-0.5 rounded">12345678bw</code></p></div>}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setConfirmModal(null)}>Bekor</Button>
              <Button variant={confirmModal.type === "delete" ? "destructive" : confirmModal.type === "block" ? (confirmModal.user.isActive ? "destructive" : "success") : "default"} onClick={handleAction} disabled={actionLoading}>{actionLoading ? "..." : confirmModal.type === "block" ? (confirmModal.user.isActive ? "Bloklash" : "Faollashtirish") : confirmModal.type === "delete" ? "O'chirish" : "Tiklash"}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
