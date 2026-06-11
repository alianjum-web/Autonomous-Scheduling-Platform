interface AuthBackButtonProps {
  onClick: () => void;
}

export function AuthBackButton({ onClick }: AuthBackButtonProps) {
  return (
    <button
      type="button"
      className="w-full text-sm text-muted-foreground hover:text-foreground"
      onClick={onClick}
    >
      ← Back
    </button>
  );
}
