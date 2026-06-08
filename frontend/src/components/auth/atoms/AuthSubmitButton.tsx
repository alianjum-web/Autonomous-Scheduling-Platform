import { Button } from "@/components/ui/button";

interface AuthSubmitButtonProps {
  loading: boolean;
  loadingLabel: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function AuthSubmitButton({
  loading,
  loadingLabel,
  children,
  disabled,
}: AuthSubmitButtonProps) {
  return (
    <Button type="submit" className="h-11 w-full text-base shadow-md" disabled={loading || disabled}>
      {loading ? loadingLabel : children}
    </Button>
  );
}
