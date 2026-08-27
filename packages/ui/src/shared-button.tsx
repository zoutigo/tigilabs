import type { ButtonHTMLAttributes } from "react";

type SharedButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function SharedButton({ variant = "primary", ...props }: SharedButtonProps) {
  return <button data-variant={variant} {...props} />;
}
