import Link from "next/link";
import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

interface ButtonLinkProps extends VariantProps<typeof buttonVariants> {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function ButtonLink({ href, children, variant, size, className }: ButtonLinkProps) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </Link>
  );
}
