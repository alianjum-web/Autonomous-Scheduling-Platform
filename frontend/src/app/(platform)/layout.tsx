import { PlatformChrome } from "@/components/common/layout/PlatformChrome";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <PlatformChrome>{children}</PlatformChrome>;
}
