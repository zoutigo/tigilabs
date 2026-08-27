import {
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  children?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  asChild,
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  const styles = [
    "tl-button",
    variant === "secondary" ? "tl-button-secondary" : "",
    variant === "ghost" ? "tl-button-ghost" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      className: [styles, child.props.className].filter(Boolean).join(" "),
    });
  }

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
}
