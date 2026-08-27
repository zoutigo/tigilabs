"use client";

import { useEffect, useState } from "react";
import type { Task, TaskGroup } from "@tigilabs/types";
import {
  getDashboard,
  getMyTasks,
  getTaskGroups,
  getTasks,
  mockTaskGroups,
  mockTasks,
} from "../lib/api/tasks";

export function useTasks(query = "") {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  useEffect(() => {
    getTasks(query)
      .then(setTasks)
      .catch(() => setTasks(mockTasks));
  }, [query]);

  return { tasks };
}

export function useTaskGroups() {
  const [groups, setGroups] = useState<TaskGroup[]>(mockTaskGroups);

  useEffect(() => {
    getTaskGroups()
      .then(setGroups)
      .catch(() => setGroups(mockTaskGroups));
  }, []);

  return { groups };
}

export function useMyTasks() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  useEffect(() => {
    getMyTasks()
      .then(setTasks)
      .catch(() =>
        setTasks(
          mockTasks.filter((task) => task.assignedToId === "user-admin"),
        ),
      );
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
          mine: {
            todo: mockTasks.filter((task) => task.status === "TODO").length,
            inProgress: mockTasks.filter(
              (task) => task.status === "IN_PROGRESS",
            ).length,
            overdue: mockTasks.filter((task) => task.isOverdue).length,
            blocked: mockTasks.filter((task) => task.status === "BLOCKED")
              .length,
          },
          urgent: mockTasks.filter((task) => task.priority === "URGENT"),
          dueSoon: mockTasks.filter(
            (task) => task.dueDate && task.status !== "DONE",
          ),
          recentActivity: mockTasks.flatMap((task) => task.history ?? []),
        });
      });
  }, []);

  return { dashboard };
}
