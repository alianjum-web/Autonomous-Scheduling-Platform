import { ResetPasswordForm } from "@/components/common/auth/ResetPasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
