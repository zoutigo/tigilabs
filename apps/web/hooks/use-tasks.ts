"use client";

import { useEffect, useState } from "react";
import type { Task, TaskGroup } from "@tigilabs/types";
import {
  getDashboard,
  getMyTasks,
  getTaskGroups,
  getTasks,
} from "../lib/api/tasks";

export function useTasks(query = "") {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    getTasks(query)
      .then(setTasks)
      .catch(() => setTasks([]));
  }, [query]);

  return { tasks };
}

export function useTaskGroups() {
  const [groups, setGroups] = useState<TaskGroup[]>([]);

  useEffect(() => {
    getTaskGroups()
      .then(setGroups)
      .catch(() => setGroups([]));
  }, []);

  return { groups };
}

export function useMyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    getMyTasks()
      .then(setTasks)
      .catch(() => setTasks([]));
  }, []);

  return { tasks };
}

export function useTaskDashboard() {
  const [dashboard, setDashboard] = useState<Awaited<
    ReturnType<typeof getDashboard>
  > | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setDashboard)
      .catch(() => {
        setDashboard({
          mine: { todo: 0, inProgress: 0, overdue: 0, blocked: 0 },
          urgent: [],
          dueSoon: [],
          recentActivity: [],
        });
      });
  }, []);

  return { dashboard };
}
