import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";

interface AuthStatusPanelProps {
  title: string;
  subtitle: string;
  message: string;
}

export function AuthStatusPanel({ title, subtitle, message }: AuthStatusPanelProps) {
  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <AuthErrorBanner message={message} />
    </AuthLayout>
  );
}
