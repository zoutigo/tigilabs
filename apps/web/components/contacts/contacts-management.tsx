"use client";

import { Archive, Mail, MailOpen } from "lucide-react";
import { useEffect, useState } from "react";
import type { ContactMessage, ContactMessageStatus } from "@tigilabs/types";
import { useContactMessages } from "../../hooks/use-contact-messages";
import { updateContactMessageStatus } from "../../lib/api/contact";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";

const statusLabel: Record<ContactMessageStatus, string> = {
  NEW: "Nouveau",
  READ: "Lu",
  ARCHIVED: "Archive",
};

const statusBadge: Record<ContactMessageStatus, string> = {
  NEW: "badge-warning",
  READ: "badge-neutral",
  ARCHIVED: "badge-success",
};

export function ContactsManagement() {
  const { messages: loadedMessages } = useContactMessages();
  const [messages, setMessages] = useState<ContactMessage[]>(loadedMessages);
  const { toast } = useToast();

  useEffect(() => {
    setMessages(loadedMessages);
  }, [loadedMessages]);

  async function handleStatusChange(
    message: ContactMessage,
    status: ContactMessageStatus,
  ) {
    const previous = message.status;
    setMessages((current) =>
      current.map((item) =>
        item.id === message.id ? { ...item, status } : item,
      ),
    );

    try {
      await updateContactMessageStatus(message.id, status);
      toast({
        title: `Message de ${message.name} marque comme ${statusLabel[status].toLowerCase()}.`,
        variant: "success",
      });
    } catch (error) {
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id ? { ...item, status: previous } : item,
        ),
      );
      toast({
        description: error instanceof Error ? error.message : undefined,
        title: "La mise a jour du message a echoue.",
        variant: "error",
      });
    }
  }

  return (
    <section className="card">
      <div className="panel-heading">
        <h3>
          <Mail size={18} />
          Messages de contact
        </h3>
        <span className="badge badge-neutral">{messages.length} messages</span>
      </div>

      {messages.length === 0 ? (
        <p className="muted">Aucun message de contact pour le moment.</p>
      ) : (
        <div className="task-table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Message</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr key={message.id}>
                  <td>
                    <strong>{message.name}</strong>
                    {message.subject ? (
                      <span className="muted"> - {message.subject}</span>
                    ) : null}
                  </td>
                  <td data-label="Email">
                    <a href={`mailto:${message.email}`}>{message.email}</a>
                  </td>
                  <td data-label="Message">
                    <span className="contact-message-excerpt">
                      {message.message}
                    </span>
                  </td>
                  <td data-label="Date">
                    {new Date(message.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td data-label="Statut">
                    <span className={`badge ${statusBadge[message.status]}`}>
                      {statusLabel[message.status]}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div className="contact-message-actions">
                      {message.status !== "READ" ? (
                        <Button
                          onClick={() => handleStatusChange(message, "READ")}
                          type="button"
                          variant="secondary"
                        >
                          <MailOpen size={15} /> Marquer lu
                        </Button>
                      ) : null}
                      {message.status !== "ARCHIVED" ? (
                        <Button
                          onClick={() =>
                            handleStatusChange(message, "ARCHIVED")
                          }
                          type="button"
                          variant="ghost"
                        >
                          <Archive size={15} /> Archiver
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
