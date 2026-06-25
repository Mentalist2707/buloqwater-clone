import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Agar tizimga kirgan bo'lsa — rolga qarab redirect
  if (session) {
    switch (session.user.role) {
      case "SUPER_ADMIN":
        redirect("/superadmin/dashboard");
      case "DIRECTOR":
        redirect("/admin");
      case "OPERATOR":
        redirect("/operator/orders");
      case "DRIVER":
        redirect("/driver/tasks");
      case "CUSTOMER":
        redirect("/customer");
      default:
        redirect("/login");
    }
  }

  // Agar tizimga kirmagan bo'lsa — Landing Page
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon.svg" alt="BuloqWater" className="h-8" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">BuloqWater</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Kirish
            </Link>
            <Link href="/register" className="px-5 py-2.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-xl shadow-lg shadow-primary-500/20 transition-all">
              Ro'yxatdan o'tish
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                Suv yetkazish platformasi
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Toza suv — <br />
                <span className="text-primary-500">sog&apos;lom hayot</span> 💧
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-6 max-w-lg">
                Eng sifatli tog&apos; suvlarini uyingizgacha yetkazib beramiz. Bir necha daqiqada buyurtma bering — ertaga eshigingizda!
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-8">
                <Link href="/register" className="px-8 py-4 text-base font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 transition-all active:scale-[0.98]">
                  Bepul ro&apos;yxatdan o&apos;tish →
                </Link>
                <Link href="/login" className="px-6 py-4 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                  Tizimga kirish
                </Link>
              </div>
              {/* Stats */}
              <div className="flex items-center gap-8 mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
                <div><p className="text-2xl font-bold text-gray-900 dark:text-white">500+</p><p className="text-xs text-gray-500 dark:text-gray-400">Doimiy mijozlar</p></div>
                <div><p className="text-2xl font-bold text-gray-900 dark:text-white">10,000+</p><p className="text-xs text-gray-500 dark:text-gray-400">Yetkazilgan buyurtmalar</p></div>
                <div><p className="text-2xl font-bold text-gray-900 dark:text-white">24/7</p><p className="text-xs text-gray-500 dark:text-gray-400">Xizmat ko&apos;rsatish</p></div>
              </div>
            </div>
            {/* Hero Image */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img src="/image.png" alt="BuloqWater" className="w-full h-auto object-cover" />
              </div>
              <div className="absolute -left-6 top-1/4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 border border-gray-100 dark:border-gray-700 animate-bounce" style={{ animationDuration: "3s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-lg">✅</div>
                  <div><p className="text-xs text-gray-500 dark:text-gray-400">Yangi buyurtma</p><p className="text-sm font-semibold text-gray-900 dark:text-white">Yetkazildi!</p></div>
                </div>
              </div>
              <div className="absolute -right-4 bottom-1/4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 border border-gray-100 dark:border-gray-700 animate-bounce" style={{ animationDuration: "4s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-lg">🚚</div>
                  <div><p className="text-xs text-gray-500 dark:text-gray-400">Haydovchi</p><p className="text-sm font-semibold text-gray-900 dark:text-white">Yo&apos;lda...</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-800/50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Nima uchun biz?</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-2xl mx-auto">BuloqWater — suv yetkazib berish sohasidagi eng zamonaviy platforma</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "⚡", title: "Tezkor yetkazish", desc: "Buyurtma berganingizdan 2 soat ichida eshigingizda" },
              { icon: "💧", title: "Sifatli suv", desc: "Tog' buloqlaridan olingan, laboratoriyada tekshirilgan" },
              { icon: "📱", title: "Qulay tizim", desc: "Telefoningizdan buyurtma bering, statusni real-time kuzating" },
              { icon: "♻️", title: "Idish nazorati", desc: "Bo'sh idishlar avtomatik hisobga olinadi" },
              { icon: "💳", title: "Qulay to'lov", desc: "Naqd, Click, Payme yoki keyinga qarz" },
              { icon: "🔔", title: "Bildirishnomalar", desc: "Buyurtma holati haqida real-time xabar" },
            ].map((f, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-2xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Qanday ishlaydi?</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3">Faqat 3 ta oson qadam</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Ro'yxatdan o'ting", desc: "Telefon raqamingiz bilan 30 soniyada", icon: "📝" },
              { step: "2", title: "Buyurtma bering", desc: "Kerakli suv turini tanlang va savatga qo'shing", icon: "🛒" },
              { step: "3", title: "Qabul qiling", desc: "Haydovchi 2 soat ichida eshigingizga yetkazadi", icon: "🎉" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary-500 text-white flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-primary-500/20">{item.icon}</div>
                <div className="text-xs font-bold text-primary-500 mb-1">QADAM {item.step}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-primary-500 to-blue-600 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Hoziroq boshlang!</h2>
            <p className="text-white/80 text-base sm:text-lg mb-8 max-w-lg mx-auto">
              Ro&apos;yxatdan o&apos;ting va birinchi buyurtmangizga 10% chegirma oling
            </p>
            <Link href="/register" className="inline-block px-8 py-4 bg-white text-primary-600 font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]">
              Bepul ro&apos;yxatdan o&apos;tish →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="BuloqWater" className="h-6" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">BuloqWater</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">&copy; {new Date().getFullYear()} BuloqWater. Barcha huquqlar himoyalangan.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Kirish</Link>
            <Link href="/register" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Ro&apos;yxatdan o&apos;tish</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
