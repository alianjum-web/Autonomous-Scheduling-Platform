import { ForgotPasswordForm } from "@/components/common/auth/ForgotPasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
