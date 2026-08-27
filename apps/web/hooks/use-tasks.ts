"use client";

import { useEffect, useState } from "react";
import type { Task } from "@tigilabs/types";
import { getTasks, mockTasks } from "../lib/api/tasks";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch(() => setTasks(mockTasks));
  }, []);

  return { tasks };
}
