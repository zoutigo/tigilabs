"use client";

import { useEffect, useState } from "react";
import type { ContactMessage } from "@tigilabs/types";
import { getContactMessages } from "../lib/api/contact";

export function useContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  useEffect(() => {
    getContactMessages()
      .then(setMessages)
      .catch(() => setMessages([]));
  }, []);

  return { messages };
}
