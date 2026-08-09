import { AppShell } from "@/components/layout/app-shell";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";

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
