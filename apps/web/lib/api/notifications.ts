import { apiClient } from "./client";

export type Notification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
};

export function getUnreadNotifications() {
  return apiClient<Notification[]>("/notifications/unread");
}

export function markNotificationAsRead(id: string) {
  return apiClient<{ count: number }>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}
