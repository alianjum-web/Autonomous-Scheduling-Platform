import Link from "next/link";

export function AppNav() {
  return (
    <nav className="border-b bg-background px-4 py-3" aria-label="Main navigation">
      <div className="mx-auto flex max-w-6xl items-center gap-6">
        <Link href="/" className="font-semibold">
          Scheduling Platform
        </Link>
        <Link href="/chat" className="text-sm text-muted-foreground hover:text-foreground">
          Patient Chat
        </Link>
        <Link href="/front-desk" className="text-sm text-muted-foreground hover:text-foreground">
          Front Desk
        </Link>
        <Link href="/appointments" className="text-sm text-muted-foreground hover:text-foreground">
          Appointments
        </Link>
        <Link href="/clinic-docs" className="text-sm text-muted-foreground hover:text-foreground">
          Clinic Docs
        </Link>
      </div>
    </nav>
  );
}
