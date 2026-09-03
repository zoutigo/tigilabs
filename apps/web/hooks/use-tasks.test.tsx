import { renderHook, waitFor } from "@testing-library/react";
import type { Task, TaskGroup } from "@tigilabs/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useMyTasks,
  useTaskDashboard,
  useTaskGroups,
  useTasks,
} from "./use-tasks";

const apiMocks = vi.hoisted(() => ({
  getTasks: vi.fn(),
  getMyTasks: vi.fn(),
  getTaskGroups: vi.fn(),
  getDashboard: vi.fn(),
}));

vi.mock("../lib/api/tasks", () => apiMocks);

describe("useTaskGroups", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("starts with an empty list instead of fabricated placeholder groups", () => {
    apiMocks.getTaskGroups.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useTaskGroups());

    expect(result.current.groups).toEqual([]);
  });

  it("exposes the real groups once the API call resolves", async () => {
    const realGroups: TaskGroup[] = [
      {
        id: "real-group-1",
        name: "Immatriculation Tigilabs",
        description: "",
        status: "ACTIVE",
        tasks: [],
      } as unknown as TaskGroup,
    ];
    apiMocks.getTaskGroups.mockResolvedValue(realGroups);

    const { result } = renderHook(() => useTaskGroups());

    await waitFor(() => expect(result.current.groups).toEqual(realGroups));
  });

  it("keeps the list empty instead of falling back to fake group ids when the API call fails", async () => {
    apiMocks.getTaskGroups.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useTaskGroups());

    await waitFor(() => expect(apiMocks.getTaskGroups).toHaveBeenCalled());
    expect(result.current.groups).toEqual([]);
  });
});

describe("useTasks", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the list empty instead of falling back to mock tasks when the API call fails", async () => {
    apiMocks.getTasks.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(apiMocks.getTasks).toHaveBeenCalled());
    expect(result.current.tasks).toEqual([]);
  });

  it("exposes the real tasks once the API call resolves", async () => {
    const realTasks: Task[] = [{ id: "real-task-1" } as Task];
    apiMocks.getTasks.mockResolvedValue(realTasks);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.tasks).toEqual(realTasks));
  });
});

describe("useMyTasks", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the list empty instead of falling back to mock tasks when the API call fails", async () => {
    apiMocks.getMyTasks.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useMyTasks());

    await waitFor(() => expect(apiMocks.getMyTasks).toHaveBeenCalled());
    expect(result.current.tasks).toEqual([]);
  });
});

describe("useTaskDashboard", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("falls back to zeroed empty stats instead of mock tasks when the API call fails", async () => {
    apiMocks.getDashboard.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useTaskDashboard());

    await waitFor(() => expect(apiMocks.getDashboard).toHaveBeenCalled());
    expect(result.current.dashboard).toEqual({
      mine: { todo: 0, inProgress: 0, overdue: 0, blocked: 0 },
      urgent: [],
      dueSoon: [],
      recentActivity: [],
    });
  });
});
