import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  return <AuthForm mode="login" />;
}
