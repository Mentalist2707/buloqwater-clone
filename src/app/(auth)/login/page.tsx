"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(error || "");

  const getSubdomain = (): string => {
    if (typeof window === "undefined") return "";
    
    // Dev mode: URL param orqali subdomen — ?subdomain=shifo
    const urlParams = new URLSearchParams(window.location.search);
    const paramSubdomain = urlParams.get("subdomain");
    if (paramSubdomain) return paramSubdomain;
    
    // Production: hostname-dan — shifo.buloqwater.uz
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    if (parts.length >= 3) return parts[0];
    if (hostname.includes(".localhost")) return parts[0];
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const subdomain = getSubdomain();

      // Telefon raqamni to'g'ri formatga keltirish
      let formattedPhone = phone.replace(/\D/g, ""); // faqat raqamlar
      if (formattedPhone.startsWith("998") && formattedPhone.length === 12) {
        formattedPhone = `+${formattedPhone}`;
      } else if (formattedPhone.length === 9) {
        formattedPhone = `+998${formattedPhone}`;
      } else if (phone.startsWith("+")) {
        formattedPhone = phone;
      } else {
        formattedPhone = `+998${formattedPhone}`;
      }

      const result = await signIn("credentials", {
        phone: formattedPhone,
        password,
        subdomain,
        redirect: false,
      });

      if (result?.error) {
        setErrorMsg(result.error);
      } else {
        // Rolga qarab redirect
        if (!subdomain || subdomain === "app") {
          router.push("/superadmin/dashboard");
        } else {
          // Subdomenli login — session olish va redirect
          router.push("/");
          router.refresh();
        }
      }
    } catch (err) {
      setErrorMsg("Tizimda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500 text-white text-2xl font-bold mb-4">
            💧
          </div>
          <h1 className="text-2xl font-bold text-gray-900">BuloqWater</h1>
          <p className="text-sm text-gray-500 mt-1">Suv yetkazish boshqaruv tizimi</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Tizimga kirish</h2>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqami</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+998</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="901234567"
                  className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
                  required
                  maxLength={9}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parol</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Kirish...
                </span>
              ) : (
                "Kirish"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          &copy; 2024 BuloqWater. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  );
}
