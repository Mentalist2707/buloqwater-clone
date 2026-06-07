import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./components/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "DIRECTOR" && session.user.role !== "SUPER_ADMIN")) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AdminSidebar />
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
