"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, label, type, ...props },
  ref,
) {
  const [isRevealed, setIsRevealed] = useState(false);
  const isPassword = type === "password";
  const inputClassName = [
    error ? "input-error" : "",
    isPassword ? "input-with-reveal" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const inputElement = (
    <input
      aria-invalid={error ? "true" : undefined}
      className={inputClassName}
      ref={ref}
      type={isPassword ? (isRevealed ? "text" : "password") : type}
      {...props}
    />
  );

  const field = isPassword ? (
    <span className="input-reveal-wrap">
      {inputElement}
      <button
        aria-label={
          isRevealed ? "Masquer le mot de passe" : "Afficher le mot de passe"
        }
        aria-pressed={isRevealed}
        className="input-reveal-toggle"
        onClick={() => setIsRevealed((current) => !current)}
        tabIndex={-1}
        type="button"
      >
        {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </span>
  ) : (
    inputElement
  );

  if (!label) {
    return field;
  }

  return (
    <label className="field">
      <span>{label}</span>
      {field}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
});
