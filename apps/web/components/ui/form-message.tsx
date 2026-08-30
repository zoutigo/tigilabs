import { CheckCircle2, CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";

type FormMessageVariant = "success" | "error" | "info";

type FormMessageProps = {
  variant: FormMessageVariant;
  title: string;
  children?: ReactNode;
};

const variantIcon: Record<FormMessageVariant, typeof CheckCircle2> = {
  error: CircleAlert,
  info: Info,
  success: CheckCircle2,
};

export function FormMessage({ variant, title, children }: FormMessageProps) {
  const Icon = variantIcon[variant];

  return (
    <div className={`form-message form-message-${variant}`} role="status">
      <Icon size={18} />
      <div>
        <strong>{title}</strong>
        {children ? <p>{children}</p> : null}
      </div>
    </div>
  );
}
