"use client";

import { cn } from "@/lib/utils";
import { useLocalizedText } from "@/lib/translate/use-localized-content";
import { useI18n } from "@/lib/i18n/provider";

type LocalizedTextProps = {
  text: string | null | undefined;
  className?: string;
  as?: "p" | "span" | "div";
  multiline?: boolean;
  showBadge?: boolean;
};

export function LocalizedText({
  text,
  className,
  as: Tag = "span",
  multiline = false,
  showBadge = false,
}: LocalizedTextProps) {
  const { t } = useI18n();
  const { display, isTranslated } = useLocalizedText(text);

  return (
    <Tag
      className={cn(
        multiline && "whitespace-pre-wrap",
        className,
      )}
    >
      {display}
      {showBadge && isTranslated ? (
        <span className="ml-1 text-[10px] font-medium uppercase tracking-wide text-muted">
          ({t("common.translated")})
        </span>
      ) : null}
    </Tag>
  );
}
