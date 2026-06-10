"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { formatPhone, formatDate } from "@/lib/utils";
import { getApplications, approveApplication, rejectApplication } from "@/actions/application-actions";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const loadData = async () => { setLoading(true); const r = await getApplications(); if (r.success && r.data) setApplications(r.data as any); setLoading(false); };
  useEffect(() => { loadData(); }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    const r = await approveApplication(id);
    if (r.success) { showToast("Zayavka qabul qilindi!"); loadData(); }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(true);
    const r = await rejectApplication(rejectModal.id, rejectNote);
    if (r.success) { showToast("Zayavka rad etildi"); setRejectModal(null); setRejectNote(""); loadData(); }
    setActionLoading(false);
  };

  const filtered = filter === "ALL" ? applications : applications.filter((a) => a.status === filter);
  const pendingCount = applications.filter((a) => a.status === "PENDING").length;

  return (
    <div className="relative">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 shadow-lg animate-in"><p className="text-sm font-medium">✅ {toast}</p></div>}

      <PageHeader title="Zayavkalar" description={`${applications.length} ta zayavka${pendingCount > 0 ? ` · ${pendingCount} ta kutilmoqda` : ""}`} />

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((f) => (
          <button key={f} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === f ? "bg-primary-500 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`} onClick={() => setFilter(f)}>
            {f === "ALL" ? "Barchasi" : f === "PENDING" ? "⏳ Kutilmoqda" : f === "APPROVED" ? "✅ Qabul" : "❌ Rad"}
            {f === "PENDING" && pendingCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px]">{pendingCount}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center"><p className="text-4xl mb-3">📋</p><p className="text-gray-500 dark:text-gray-400">Zayavka topilmadi</p></div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <div key={app.id} className={`bg-white dark:bg-gray-800 rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${app.status === "PENDING" ? "border-yellow-200 dark:border-yellow-800" : app.status === "APPROVED" ? "border-green-200 dark:border-green-800" : "border-red-200 dark:border-red-800"}`}>
              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{app.companyName}</h3>
                      <Badge variant={app.status === "PENDING" ? "warning" : app.status === "APPROVED" ? "success" : "destructive"}>
                        {app.status === "PENDING" ? "Kutilmoqda" : app.status === "APPROVED" ? "Qabul qilingan" : "Rad etilgan"}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>👤 <span className="text-gray-900 dark:text-white font-medium">{app.ownerName}</span></p>
                      <p>📞 {formatPhone(app.phone)}</p>
                      {app.address && <p>📍 {app.address}</p>}
                      {app.description && <p className="text-xs bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg mt-2">{app.description}</p>}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{formatDate(app.createdAt)}</p>
                    {app.adminNote && <p className="text-xs text-red-500 mt-1">Admin izoh: {app.adminNote}</p>}
                  </div>

                  {/* Actions */}
                  {app.status === "PENDING" && (
                    <div className="flex items-center gap-2">
                      <Button variant="success" size="sm" onClick={() => handleApprove(app.id)} disabled={actionLoading}>✅ Qabul</Button>
                      <Button variant="destructive" size="sm" onClick={() => { setRejectModal(app); setRejectNote(""); }} disabled={actionLoading}>❌ Rad</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Zayavkani rad etish">
        {rejectModal && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{rejectModal.companyName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{rejectModal.ownerName} · {formatPhone(rejectModal.phone)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sabab (ixtiyoriy)</label>
              <Input value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Rad etish sababi..." />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectModal(null)}>Bekor</Button>
              <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>{actionLoading ? "..." : "Rad etish"}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
