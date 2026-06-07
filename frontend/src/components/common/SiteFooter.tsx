import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
          <p className="font-bold">Symptra Scheduling</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            AI-first patient intake · HIPAA-aware · Multi-tenant clinical scheduling
          </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-4">
            <div className="space-y-2">
              <p className="font-medium text-foreground">Product</p>
              <div className="flex flex-col gap-2 text-muted-foreground">
                <Link href="/chat" className="hover:text-foreground">
                  Patient Chat
                </Link>
                <Link href="/front-desk" className="hover:text-foreground">
                  Front Desk
                </Link>
                <Link href="/appointments" className="hover:text-foreground">
                  Appointments
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Account</p>
              <div className="flex flex-col gap-2 text-muted-foreground">
                <Link href="/sign-in" className="hover:text-foreground">
                  Sign in
                </Link>
                <Link href="/sign-up" className="hover:text-foreground">
                  Sign up
                </Link>
                <Link href="/settings" className="hover:text-foreground">
                  Settings
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Support</p>
              <div className="flex flex-col gap-2 text-muted-foreground">
                <Link href="/help" className="hover:text-foreground">
                  Help center
                </Link>
                <Link href="/status" className="hover:text-foreground">
                  System status
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Legal</p>
              <div className="flex flex-col gap-2 text-muted-foreground">
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-foreground">
                  Terms
                </Link>
                <Link href="/hipaa-notice" className="hover:text-foreground">
                  HIPAA Notice
                </Link>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-8 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Symptra Scheduling. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
