import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OperatorSidebar } from "./components/sidebar";

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "OPERATOR" && session.user.role !== "DIRECTOR" && session.user.role !== "SUPER_ADMIN")) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <OperatorSidebar />
      <main className="lg:ml-64 p-4 pt-16 lg:pt-8 lg:p-8">{children}</main>
    </div>
  );
}
