import Image from "next/image";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/common/theme/ThemeToggle";
import { IMAGES } from "@/lib/constants/images";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <div className="relative hidden w-full flex-col justify-between overflow-hidden p-10 text-primary-foreground lg:flex lg:w-[44%] xl:w-[42%]">
        <Image
          src={IMAGES.auth}
          alt=""
          fill
          className="object-cover opacity-20"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-info/80" />
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 text-lg font-bold">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Stethoscope className="size-5" aria-hidden />
            </span>
            Symptra
          </Link>
        </div>
        <div className="relative z-10 space-y-6">
          <blockquote className="space-y-4">
            <p className="text-2xl font-semibold leading-snug tracking-tight xl:text-3xl">
              AI-powered appointment experience for modern clinics
            </p>
            <footer className="text-sm text-primary-foreground/80">
              HIPAA-aware · Multi-tenant RLS · Zero-PHI logs
            </footer>
          </blockquote>
          <ul className="grid gap-3 text-sm text-primary-foreground/90">
            <li className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-white/80" />
              Streaming triage with emergency override
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-white/80" />
              Autonomous scheduling with slot locks
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-white/80" />
              Real-time front-desk escalations
            </li>
          </ul>
        </div>
        <p className="relative z-10 text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Symptra Scheduling
        </p>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-end gap-2 px-4 py-3 lg:px-8">
          <ThemeToggle />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-12 sm:px-8">
          <div className="mb-8 w-full max-w-md lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-primary">
              <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/10">
                <Stethoscope className="size-4" aria-hidden />
              </span>
              Symptra
            </Link>
          </div>
          <div className="glass-panel w-full max-w-md space-y-8 p-8">
            <div className="space-y-2 text-center lg:text-left">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
