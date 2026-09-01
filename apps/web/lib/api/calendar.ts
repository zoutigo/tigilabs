import type {
  CalendarCategory,
  CalendarEvent,
  CreateEventPayload,
  EventHistoryEntry,
  ParticipantStatus,
  RecurrenceScope,
  UpdateEventPayload,
  UserAvailability,
} from "@tigilabs/types";
import { mockUsers } from "./users";
import { apiClient } from "./client";

const [admin, manager, member] = mockUsers;

function iso(daysFromNow: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function mockEvent(input: {
  id: string;
  title: string;
  description?: string;
  day: number;
  startHour: number;
  endHour: number;
  location?: string;
  categoryColor?: string;
  categoryName?: string;
  participants?: typeof mockUsers;
}): CalendarEvent {
  const participants = input.participants ?? [manager];

  return {
    id: input.id,
    title: input.title,
    description: input.description ?? null,
    startAt: iso(input.day, input.startHour),
    endAt: iso(input.day, input.endHour),
    allDay: false,
    timezone: "Europe/Paris",
    location: input.location ?? null,
    meetingUrl: null,
    privacy: "NORMAL",
    status: "CONFIRMED",
    organizerId: admin.id,
    organizer: admin,
    categoryId: input.categoryName ? `cat-${input.categoryName}` : null,
    category: input.categoryName
      ? {
          id: `cat-${input.categoryName}`,
          name: input.categoryName,
          color: input.categoryColor ?? "#2563EB",
          isGlobal: true,
        }
      : null,
    seriesId: null,
    participants: [
      { eventId: input.id, userId: admin.id, status: "ACCEPTED", user: admin },
      ...participants.map((user) => ({
        eventId: input.id,
        userId: user.id,
        status: "PENDING" as const,
        user,
      })),
    ],
    reminders: [{ minutesBefore: 30, channel: "EMAIL" }],
    attachments: [],
  };
}

export const mockCalendarCategories: CalendarCategory[] = [
  {
    id: "cat-Reunion interne",
    name: "Reunion interne",
    color: "#2563EB",
    isGlobal: true,
  },
  {
    id: "cat-Client",
    name: "Client / Ecole",
    color: "#16A34A",
    isGlobal: true,
  },
  {
    id: "cat-Deploiement",
    name: "Deploiement",
    color: "#7C3AED",
    isGlobal: true,
  },
];

export const mockCalendarEvents: CalendarEvent[] = [
  mockEvent({
    id: "event-standup",
    title: "Reunion equipe developpement",
    day: 0,
    startHour: 9,
    endHour: 10,
    categoryName: "Reunion interne",
    categoryColor: "#2563EB",
    participants: [manager, member],
  }),
  mockEvent({
    id: "event-ecole",
    title: "Presentation Ecole Sainte Marie",
    day: 0,
    startHour: 14,
    endHour: 15,
    location: "Ecole Sainte Marie",
    categoryName: "Client",
    categoryColor: "#16A34A",
    participants: [manager],
  }),
  mockEvent({
    id: "event-admin",
    title: "Point administratif",
    day: 1,
    startHour: 10,
    endHour: 11,
    categoryName: "Deploiement",
    categoryColor: "#7C3AED",
    participants: [member],
  }),
];

export function getEvents(
  from: string,
  to: string,
  params?: { q?: string; categoryId?: string; calendarUserId?: string },
) {
  const search = new URLSearchParams({ from, to, ...params });
  return apiClient<CalendarEvent[]>(`/calendar/events?${search.toString()}`);
}

export function getUpcomingEvents() {
  return apiClient<CalendarEvent[]>("/calendar/events/dashboard/upcoming");
}

export function getEvent(id: string) {
  return apiClient<CalendarEvent>(`/calendar/events/${id}`);
}

export function getEventHistory(id: string) {
  return apiClient<EventHistoryEntry[]>(`/calendar/events/${id}/history`);
}

export function createEvent(payload: CreateEventPayload) {
  return apiClient<CalendarEvent>("/calendar/events", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function updateEvent(
  id: string,
  payload: UpdateEventPayload,
  scope?: RecurrenceScope,
) {
  const search = scope ? `?scope=${scope}` : "";
  return apiClient<CalendarEvent>(`/calendar/events/${id}${search}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function deleteEvent(id: string, scope?: RecurrenceScope) {
  const search = scope ? `?scope=${scope}` : "";
  return apiClient<{ ok: boolean; cancelled: boolean }>(
    `/calendar/events/${id}${search}`,
    { method: "DELETE" },
  );
}

export function respondToEvent(id: string, status: ParticipantStatus) {
  return apiClient<CalendarEvent>(`/calendar/events/${id}/respond`, {
    body: JSON.stringify({ status }),
    method: "POST",
  });
}

export function getCategories() {
  return apiClient<CalendarCategory[]>("/calendar/categories");
}

export function createCategory(payload: {
  name: string;
  color: string;
  isGlobal?: boolean;
}) {
  return apiClient<CalendarCategory>("/calendar/categories", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function deleteCategory(id: string) {
  return apiClient<void>(`/calendar/categories/${id}`, { method: "DELETE" });
}

export function getAvailability(userIds: string[], from: string, to: string) {
  const search = new URLSearchParams({ userIds: userIds.join(","), from, to });
  return apiClient<UserAvailability[]>(
    `/calendar/availability?${search.toString()}`,
  );
}

export function uploadAttachment(eventId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient<{ id: string }>(`/calendar/events/${eventId}/attachments`, {
    body: formData,
    method: "POST",
  });
}

export function deleteAttachment(eventId: string, attachmentId: string) {
  return apiClient<{ ok: boolean }>(
    `/calendar/events/${eventId}/attachments/${attachmentId}`,
    { method: "DELETE" },
  );
}

export function attachmentDownloadUrl(eventId: string, attachmentId: string) {
  return `/api/backend/calendar/events/${eventId}/attachments/${attachmentId}`;
}
