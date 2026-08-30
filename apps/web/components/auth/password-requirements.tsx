"use client";

import { Check, X } from "lucide-react";

const passwordRules: Array<{
  label: string;
  test: (value: string) => boolean;
}> = [
  { label: "8 caracteres minimum", test: (value) => value.length >= 8 },
  { label: "Une majuscule", test: (value) => /[A-Z]/.test(value) },
  { label: "Une minuscule", test: (value) => /[a-z]/.test(value) },
  {
    label: "Un caractere special",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

export function PasswordRequirements({ value }: Readonly<{ value: string }>) {
  return (
    <ul className="password-rules">
      {passwordRules.map((rule) => {
        const met = rule.test(value);

        return (
          <li
            className={met ? "password-rule is-met" : "password-rule"}
            key={rule.label}
          >
            {met ? <Check size={13} /> : <X size={13} />}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
