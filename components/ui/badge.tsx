import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const badgeVariants = cva(
  "inline-flex h-6 items-center rounded-md border px-2 text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        neutral: "border-slate-600 bg-slate-800/70 text-slate-200",
        success: "border-emerald-500/50 bg-emerald-500/14 text-emerald-200",
        warning: "border-amber-500/50 bg-amber-500/14 text-amber-200",
        danger: "border-red-500/50 bg-red-500/14 text-red-200",
        info: "border-sky-500/50 bg-sky-500/14 text-sky-200"
      }
    },
    defaultVariants: {
      variant: "neutral"
    }
  }
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
