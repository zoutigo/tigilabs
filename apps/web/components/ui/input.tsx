import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, label, ...props },
  ref,
) {
  const inputClassName = [error ? "input-error" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  if (!label) {
    return (
      <input
        aria-invalid={error ? "true" : undefined}
        className={inputClassName}
        ref={ref}
        {...props}
      />
    );
  }

  return (
    <label className="field">
      <span>{label}</span>
      <input
        aria-invalid={error ? "true" : undefined}
        className={inputClassName}
        ref={ref}
        {...props}
      />
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
});
