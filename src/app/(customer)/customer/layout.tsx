"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ThemeToggleCompact } from "@/components/ui/theme-toggle";

const navItems = [
  { label: "Do'kon", href: "/customer", icon: "🛍️", exact: true },
  { label: "Buyurtmalarim", href: "/customer/orders", icon: "📦" },
  { label: "Manzillarim", href: "/customer/addresses", icon: "📍" },
  { label: "Idishlar", href: "/customer/bottles", icon: "♻️" },
  { label: "Sozlamalar", href: "/customer/settings", icon: "⚙️" },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Header — faqat desktop */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/customer" className="flex items-center gap-2">
            <img src="/icon.svg" alt="BuloqWater" className="h-7 dark:invert" />
            <span className="text-base font-bold text-gray-900 dark:text-white">BuloqWater</span>
          </Link>

          {/* Desktop Nav — mobileda ko'rinmaydi */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggleCompact />
            {session?.user && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm">
                  {session.user.name?.charAt(0)}
                </div>
                <button
                  onClick={() => { const origin = typeof window !== "undefined" ? window.location.origin : ""; signOut({ callbackUrl: `${origin}/login` }); }}
                  className="text-xs text-red-500 hover:underline hidden sm:block"
                >
                  Chiqish
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>

      {/* Mobile Bottom Nav — faqat mobileda */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shadow-lg md:hidden safe-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.slice(0, 4).map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg transition-all min-w-[44px]",
                  isActive ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30" : "text-gray-400 dark:text-gray-500"
                )}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          {/* Logout */}
          <button
            onClick={() => { const origin = typeof window !== "undefined" ? window.location.origin : ""; signOut({ callbackUrl: `${origin}/login` }); }}
            className="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg transition-all min-w-[44px] text-red-400"
          >
            <span className="text-xl">🚪</span>
            <span className="text-[10px] font-medium">Chiqish</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
