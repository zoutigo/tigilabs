"use client";

import { FileText, Paperclip, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { EventAttachment } from "@tigilabs/types";
import {
  attachmentDownloadUrl,
  deleteAttachment,
  uploadAttachment,
} from "../../lib/api/calendar";
import { useToast } from "../ui/toast";

type AttachmentUploaderProps = {
  eventId: string;
  attachments: EventAttachment[];
  currentUserId?: string;
  canDeleteOthers?: boolean;
  onChange: (attachments: EventAttachment[]) => void;
};

export function AttachmentUploader({
  eventId,
  attachments,
  currentUserId,
  canDeleteOthers,
  onChange,
}: AttachmentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function handleFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const uploaded = await uploadAttachment(eventId, file);
        onChange([
          ...attachments,
          {
            id: uploaded.id,
            eventId,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            uploadedById: currentUserId ?? "",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      toast({
        title: "Envoi echoue",
        description: "La piece jointe n'a pas pu etre envoyee.",
        variant: "error",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(attachmentId: string) {
    try {
      await deleteAttachment(eventId, attachmentId);
      onChange(attachments.filter((item) => item.id !== attachmentId));
    } catch {
      toast({ title: "Suppression impossible", variant: "error" });
    }
  }

  return (
    <div className="attachment-uploader">
      <div
        className={`attachment-dropzone${isDragging ? " attachment-dropzone-active" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <Upload size={18} />
        <span>
          {isUploading
            ? "Envoi en cours..."
            : "Glissez un fichier ou cliquez pour choisir"}
        </span>
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </div>
      <ul className="attachment-list">
        {attachments.map((attachment) => {
          const canDelete =
            canDeleteOthers || attachment.uploadedById === currentUserId;
          return (
            <li key={attachment.id} className="attachment-list-item">
              <FileText size={16} />
              <a
                href={attachmentDownloadUrl(eventId, attachment.id)}
                target="_blank"
                rel="noreferrer"
              >
                {attachment.fileName}
              </a>
              <span className="muted">{formatSize(attachment.sizeBytes)}</span>
              {canDelete ? (
                <button
                  type="button"
                  aria-label={`Supprimer ${attachment.fileName}`}
                  onClick={() => void handleDelete(attachment.id)}
                >
                  <Trash2 size={14} />
                </button>
              ) : null}
            </li>
          );
        })}
        {!attachments.length ? (
          <li className="muted">
            <Paperclip size={14} /> Aucune piece jointe.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} o`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} Ko`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
