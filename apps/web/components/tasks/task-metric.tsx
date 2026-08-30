import type { LucideIcon } from "lucide-react";

export function Metric({
  icon: Icon,
  label,
  subtitle,
  tone,
  value,
}: Readonly<{
  icon: LucideIcon;
  label: string;
  subtitle: string;
  tone?: "blue" | "danger" | "success";
  value: number;
}>) {
  return (
    <article className={`metric ${tone ? `metric-${tone}` : ""}`}>
      <span className="metric-icon" aria-hidden="true">
        <Icon size={22} />
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{subtitle}</small>
    </article>
  );
}
