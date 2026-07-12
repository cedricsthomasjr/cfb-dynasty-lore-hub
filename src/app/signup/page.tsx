import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  return <AuthForm mode="signup" />;
}
