import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/** Shared control chrome — same padding/type for Input, Textarea, Select. */
const controlClass =
  "w-full max-w-full rounded-2xl border-0 bg-canvas-deep px-3 py-2.5 text-base leading-snug text-ink outline-none ring-primary/25 placeholder:text-muted focus:ring-2 sm:px-4";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(controlClass, "placeholder:truncate", className)}
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
    <select className={cn(controlClass, "appearance-none", className)} {...props}>
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
