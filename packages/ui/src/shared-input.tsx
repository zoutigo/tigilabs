import type { InputHTMLAttributes } from "react";

export function SharedInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}
