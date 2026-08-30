import type { ContactMessage, ContactMessageStatus } from "@tigilabs/types";
import type { ContactMessageInput } from "@tigilabs/schemas";
import { apiClient } from "./client";

export function submitContactMessage(
  payload: ContactMessageInput & { startedAt?: string },
) {
  return apiClient<{ message: string }>("/contact", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function getContactMessages(status?: ContactMessageStatus) {
  const query = status ? `?status=${status}` : "";
  return apiClient<ContactMessage[]>(`/contact${query}`);
}

export function updateContactMessageStatus(
  id: string,
  status: ContactMessageStatus,
) {
  return apiClient<ContactMessage>(`/contact/${id}`, {
    body: JSON.stringify({ status }),
    method: "PATCH",
  });
}
