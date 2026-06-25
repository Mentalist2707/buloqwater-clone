import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth";

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  switch (user?.role) {
    case "DRIVER":      return <Redirect href="/(driver)/tasks" />;
    case "DIRECTOR":    return <Redirect href="/(admin)/dashboard" />;
    case "SUPER_ADMIN": return <Redirect href="/(superadmin)/dashboard" />;
    case "CUSTOMER":    return <Redirect href="/(customer)/home" />;
    case "OPERATOR":    return <Redirect href="/(operator)/orders" />;
    default:            return <Redirect href="/(operator)/orders" />;
  }
}
