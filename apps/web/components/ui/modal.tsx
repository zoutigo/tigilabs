"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "./button";

type ModalProps = {
  title: string;
  open: boolean;
  children: React.ReactNode;
  onClose?: () => void;
};

export function Modal({ title, open, children, onClose }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    triggerRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const bodyFocusable = panelRef.current?.querySelector<HTMLElement>(
      '.modal-body input, .modal-body textarea, .modal-body select, .modal-body button, .modal-body [tabindex]:not([tabindex="-1"])',
    );
    (bodyFocusable ?? panelRef.current)?.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus({ preventScroll: true });
      }
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        ref={panelRef}
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <Button
            aria-label="Fermer"
            onClick={onClose}
            type="button"
            variant="ghost"
          >
            <X size={18} />
          </Button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
