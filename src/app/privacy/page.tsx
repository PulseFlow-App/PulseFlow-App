import Link from "next/link";
import { PulseMark } from "@/components/brand/pulse-mark";
import { brand } from "@/lib/design-tokens";

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-sand px-4 py-10">
      <div className="mx-auto max-w-lg space-y-4">
        <PulseMark className="size-10" />
        <h1 className="font-display text-2xl font-bold text-ink">
          {brand.name} Privacy
        </h1>
        <p className="text-sm text-muted">
          We store account, organization, villa, job, and messaging data needed
          to run operations. Payment details for company subscriptions are
          processed by Stripe; we store Stripe customer and subscription IDs on
          the organization record.
        </p>
        <p className="text-sm text-muted">
          Replace this placeholder with counsel-reviewed privacy policy before
          public launch.
        </p>
        <Link href="/register" className="font-semibold text-primary">
          Back to register
        </Link>
      </div>
    </div>
  );
}
