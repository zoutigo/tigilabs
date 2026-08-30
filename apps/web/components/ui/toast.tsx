"use client";

import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "error" | "info";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = ToastInput & { id: string };

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;

const variantIcon: Record<ToastVariant, typeof CheckCircle2> = {
  error: CircleAlert,
  info: Info,
  success: CheckCircle2,
};

export function ToastProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const item: ToastItem = { variant: "info", ...input, id };
      setToasts((current) => [...current, item]);

      window.setTimeout(() => {
        dismiss(id);
      }, input.duration ?? DEFAULT_DURATION);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="toast-viewport">
        {toasts.map((item) => {
          const Icon = variantIcon[item.variant ?? "info"];

          return (
            <div
              className={`toast toast-${item.variant ?? "info"}`}
              key={item.id}
              role="status"
            >
              <Icon size={18} />
              <div className="toast-content">
                <strong>{item.title}</strong>
                {item.description ? <p>{item.description}</p> : null}
              </div>
              <button
                aria-label="Fermer la notification"
                className="toast-close"
                onClick={() => dismiss(item.id)}
                type="button"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
