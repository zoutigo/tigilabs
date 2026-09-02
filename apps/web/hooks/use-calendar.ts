"use client";

import { useCallback, useEffect, useState } from "react";
import type { CalendarCategory, CalendarEvent } from "@tigilabs/types";
import {
  getCategories,
  getEvents,
  getUpcomingEvents,
  mockCalendarCategories,
  mockCalendarEvents,
} from "../lib/api/calendar";

export function useCalendarEvents(from: string, to: string) {
  const [events, setEvents] = useState<CalendarEvent[]>(mockCalendarEvents);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    setLoading(true);
    return getEvents(from, to)
      .then(setEvents)
      .catch(() => setEvents(mockCalendarEvents))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getEvents(from, to)
      .then((result) => {
        if (!cancelled) {
          setEvents(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEvents(mockCalendarEvents);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [from, to]);

  return { events, loading, refetch };
}

export function useUpcomingEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>(
    mockCalendarEvents.slice(0, 5),
  );

  useEffect(() => {
    getUpcomingEvents()
      .then(setEvents)
      .catch(() => setEvents(mockCalendarEvents.slice(0, 5)));
  }, []);

  return { events };
}

export function useCalendarCategories() {
  const [categories, setCategories] = useState<CalendarCategory[]>(
    mockCalendarCategories,
  );

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories(mockCalendarCategories));
  }, []);

  return { categories };
}
