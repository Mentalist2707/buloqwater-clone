"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/actions/forgot-password-action";

type Step = "form" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("form");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [companyName, setCompanyName] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await requestPasswordReset(phone);

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Xatolik yuz berdi");
      return;
    }

    setUserName(result.data!.name);
    setCompanyName(result.data!.companyName);
    setStep("success");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/login">
            <div className="relative h-36 sm:h-56 mx-auto mb-2">
              <img
                src="/image.png"
                alt="BuloqWater Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400">Suv yetkazish boshqaruv tizimi</p>
        </div>

        {step === "form" ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">

            {/* Sarlavha */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Parolni tiklash</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Telefon raqamingizni kiriting — adminizga tiklash so'rovi yuboramiz.
              </p>
            </div>

            {/* Xato */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                ❌ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Telefon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefon raqami
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium select-none">
                    +998
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="901234567"
                    maxLength={9}
                    required
                    disabled={loading}
                    className="w-full pl-14 pr-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Tugma */}
              <button
                type="submit"
                disabled={loading || phone.length < 9}
                className="w-full py-3.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 dark:disabled:bg-primary-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-primary-600/25 hover:shadow-primary-600/35 active:scale-[0.98] disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Tekshirilmoqda...
                  </span>
                ) : (
                  "So'rov yuborish"
                )}
              </button>
            </form>
          </div>
        ) : (
          /* ---- Muvaffaqiyat ekrani ---- */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 text-center">

            {/* Yashil aylana + belgi */}
            <div className="flex items-center justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              So'rov yuborildi!
            </h2>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium text-gray-800 dark:text-white">{userName}</span>,
              sizning so'rovingiz qabul qilindi.
            </p>

            {companyName && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Kompaniya: <span className="font-medium">{companyName}</span>
              </p>
            )}

            {/* Keyingi qadam haqida izoh */}
            <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-left">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wide">
                Keyingi qadam
              </p>
              <ul className="space-y-1.5 text-sm text-blue-700 dark:text-blue-300">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">1️⃣</span>
                  <span>Kompaniyangiz administratori so'rovni ko'radi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">2️⃣</span>
                  <span>Admin yangi parolni belgilab, siz bilan bog'lanadi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">3️⃣</span>
                  <span>Yangi parol bilan tizimga kiring va uni o'zgartiring.</span>
                </li>
              </ul>
            </div>

            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-primary-600/25"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kirish sahifasiga qaytish
            </Link>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          &copy; {new Date().getFullYear()} BuloqWater. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  );
}
