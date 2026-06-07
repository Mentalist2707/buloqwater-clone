import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "DRIVER" && session.user.role !== "DIRECTOR" && session.user.role !== "SUPER_ADMIN")) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2"><span className="text-xl">🚚</span><div><h1 className="text-sm font-bold">BuloqWater</h1><p className="text-xs text-gray-500">Haydovchi</p></div></div>
          <span className="text-xs text-gray-500">{session.user.name}</span>
        </div>
      </header>
      <main className="max-w-lg mx-auto p-4 pb-20">{children}</main>
    </div>
  );
}
