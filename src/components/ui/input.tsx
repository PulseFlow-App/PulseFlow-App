import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared control chrome - same padding/type for Input, Textarea, Select. */
const controlClass =
  "w-full max-w-full min-h-11 min-w-0 rounded-pf-control border border-pf-line bg-pf-card px-3 text-pf-16 leading-snug text-pf-ink outline-none placeholder:text-pf-text-tertiary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-pf-navy-600";

/** Native date/time controls overflow rounded parents unless capped. */
const dateTimeClass =
  "min-w-0 max-w-full overflow-hidden px-2 text-sm sm:px-3 [color-scheme:light] [&::-webkit-calendar-picker-indicator]:mr-0 [&::-webkit-date-and-time-value]:min-w-0";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, type, ...props }, ref) {
  const isDateTime = type === "date" || type === "time" || type === "datetime-local";
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        controlClass,
        "placeholder:truncate",
        isDateTime && dateTimeClass,
        className,
      )}
      {...props}
    />
  );
});

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(controlClass, "resize-y", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative w-full max-w-full min-w-0">
      <select
        className={cn(controlClass, "appearance-none pe-10", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
    </div>
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1 block text-pf-14 font-medium leading-snug text-pf-ink break-words",
        className,
      )}
      {...props}
    />
  );
}
