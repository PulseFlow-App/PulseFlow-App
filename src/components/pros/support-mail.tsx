import { brand } from "@/lib/design-tokens";
import { prosT } from "@/lib/pros/i18n";

/** Support inbox. Not a login address, and not orange. */
export function SupportMail({ locale }: { locale: string }) {
  return (
    <p className="text-center text-pf-14 leading-relaxed text-pf-text-secondary">
      {prosT(locale, "supportHint")}{" "}
      <a
        href={`mailto:${brand.supportEmail}`}
        className="font-medium text-pf-text-secondary"
      >
        {brand.supportEmail}
      </a>
    </p>
  );
}
