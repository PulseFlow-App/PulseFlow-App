import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared control chrome — same padding/type for Input, Textarea, Select. */
const controlClass =
  "w-full max-w-full min-w-0 rounded-2xl border-0 bg-canvas-deep px-3 py-2.5 text-base leading-snug text-ink outline-none ring-primary/25 placeholder:text-muted focus:ring-2 sm:px-4";

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
        "mb-1.5 block text-sm font-medium leading-snug text-ink break-words",
        className,
      )}
      {...props}
    />
  );
}
