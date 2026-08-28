import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  noIndex: true,
});

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <ServiceWorkerRegister />
    </>
  );
}
