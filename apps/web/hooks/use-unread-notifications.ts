"use client";

import { useEffect, useState } from "react";
import {
  getUnreadNotifications,
  type Notification,
} from "../lib/api/notifications";

export function useUnreadNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    getUnreadNotifications()
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, []);

  return { notifications };
}
