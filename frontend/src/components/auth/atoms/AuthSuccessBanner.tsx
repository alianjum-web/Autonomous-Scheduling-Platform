interface AuthSuccessBannerProps {
  message: string;
  className?: string;
}

export function AuthSuccessBanner({ message, className }: AuthSuccessBannerProps) {
  return <p className={className ?? "status-success text-left"}>{message}</p>;
}
