import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth";

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role === "DRIVER") {
    return <Redirect href="/(driver)/tasks" />;
  }

  return <Redirect href="/(operator)/orders" />;
}
