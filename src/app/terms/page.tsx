import Link from "next/link";
import { PulseMark } from "@/components/brand/pulse-mark";
import { brand } from "@/lib/design-tokens";

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-sand px-4 py-10">
      <div className="mx-auto max-w-lg space-y-4">
        <PulseMark className="size-10" />
        <h1 className="font-display text-2xl font-bold text-ink">
          {brand.name} Terms
        </h1>
        <p className="text-sm text-muted">
          Personal workspaces are free. Company organizations receive a 30-day
          free trial. After the trial, the company owner must keep an active
          subscription for invite, villa, and service-order writes. Managers,
          cleaners, and staff are never billed personally.
        </p>
        <p className="text-sm text-muted">
          Replace this placeholder with counsel-reviewed terms before public
          launch.
        </p>
        <Link href="/register" className="font-semibold text-primary">
          Back to register
        </Link>
      </div>
    </div>
  );
}
