import { Button } from "@/components/ui/button";

interface AuthSubmitButtonProps {
  loading: boolean;
  loadingLabel: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export function AuthSubmitButton({
  loading,
  loadingLabel,
  children,
  disabled,
  onClick,
}: AuthSubmitButtonProps) {
  return (
    <Button
      type={onClick ? "button" : "submit"}
      className="h-11 w-full text-base shadow-md"
      disabled={loading || disabled}
      onClick={onClick}
    >
      {loading ? loadingLabel : children}
    </Button>
  );
}
