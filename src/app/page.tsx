import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  switch (session.user.role) {
    case "SUPER_ADMIN":
      redirect("/superadmin/dashboard");
    case "DIRECTOR":
      redirect("/admin");
    case "OPERATOR":
      redirect("/operator/orders");
    case "DRIVER":
      redirect("/driver/tasks");
    default:
      redirect("/login");
  }
}
