"use client";

import type { ReactNode } from "react";
import { useRevealOnScroll } from "../../hooks/use-reveal-on-scroll";

type RevealProps = {
  as?: "div" | "article";
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function Reveal({
  as = "div",
  children,
  className = "",
  delay = 0,
}: Readonly<RevealProps>) {
  const { ref, isVisible } = useRevealOnScroll<HTMLDivElement>();
  const classes = `reveal ${isVisible ? "is-visible" : ""} ${className}`.trim();
  const style = delay ? { transitionDelay: `${delay}ms` } : undefined;

  if (as === "article") {
    return (
      <article className={classes} ref={ref} style={style}>
        {children}
      </article>
    );
  }

  return (
    <div className={classes} ref={ref} style={style}>
      {children}
    </div>
  );
}
