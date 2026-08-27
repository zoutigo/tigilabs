import { X } from "lucide-react";
import { Button } from "./button";

type ModalProps = {
  title: string;
  open: boolean;
  children: React.ReactNode;
  onClose?: () => void;
};

export function Modal({ title, open, children, onClose }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      style={{
        alignItems: "center",
        background: "rgba(15, 31, 46, 0.48)",
        display: "grid",
        inset: 0,
        padding: 24,
        position: "fixed",
        zIndex: 20,
      }}
    >
      <section
        className="card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="toolbar">
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
        {children}
      </section>
    </div>
  );
}
