import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "BuloqWater - Haydovchi",
  description: "Haydovchi vazifalar paneli",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BuloqWater",
  },
};

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.role !== "DRIVER" &&
      session.user.role !== "DIRECTOR" &&
      session.user.role !== "SUPER_ADMIN")
  )
    redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* PWA-optimized Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 shadow-sm safe-top">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <img
              src="/image.png"
              alt="BuloqWater"
              className="w-9 h-9 dark:invert"
            />
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white">
                BuloqWater
              </h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Haydovchi paneli
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              🟢 {session.user.name}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-24">{children}</main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shadow-lg safe-bottom z-40">
        <div className="flex items-center justify-around max-w-lg mx-auto py-2">
          <a
            href="/driver/tasks"
            className="flex flex-col items-center gap-0.5 py-1 px-4 text-primary-600">
            <span className="text-xl">📋</span>
            <span className="text-[10px] font-bold">Vazifalar</span>
          </a>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex flex-col items-center gap-0.5 py-1 px-4 text-gray-400 hover:text-red-500">
              <span className="text-xl">🚪</span>
              <span className="text-[10px] font-medium">Chiqish</span>
            </button>
          </form>
        </div>
      </nav>
    </div>
  );
}
