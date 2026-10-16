import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full max-w-full rounded-2xl border-0 bg-canvas-deep px-3 py-2.5 text-base text-ink outline-none ring-primary/25 placeholder:text-muted placeholder:truncate focus:ring-2 sm:px-4 sm:py-3",
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
      className={cn(
        "w-full max-w-full rounded-2xl border-0 bg-canvas-deep px-3 py-2.5 text-base text-ink outline-none ring-primary/25 placeholder:text-muted focus:ring-2 sm:px-4 sm:py-3",
        className,
      )}
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
    <select
      className={cn(
        "w-full max-w-full appearance-none rounded-2xl border-0 bg-canvas-deep px-3 py-2.5 text-sm text-ink outline-none ring-primary/25 focus:ring-2 sm:px-4 sm:py-3 sm:text-base",
        className,
      )}
      {...props}
    >
      {children}
    </select>
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
