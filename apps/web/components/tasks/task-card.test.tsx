import { render, screen } from "@testing-library/react";
import type { Task } from "@tigilabs/types";
import { describe, expect, it } from "vitest";
import { TaskCard } from "./task-card";

const task: Task = {
  id: "task-1",
  groupId: "group-1",
  title: "Structurer la roadmap",
  description: "Prioriser les prochains modules.",
  status: "IN_PROGRESS",
  priority: "HIGH",
  assignee: {
    id: "user-1",
    name: "Admin Tigilabs",
    email: "admin@tigilabs.com",
    role: "Admin",
    status: "ACTIVE",
  },
};

describe("TaskCard", () => {
  it("renders task details and links to the detail page", () => {
    render(<TaskCard task={task} />);

    expect(screen.getByRole("link", { name: task.title })).toHaveAttribute(
      "href",
      "/tasks/task-1",
    );
    expect(screen.getByText(task.description as string)).toBeInTheDocument();
    expect(
      screen.getByText("Responsable : Admin Tigilabs"),
    ).toBeInTheDocument();
    expect(screen.getByText("En cours")).toBeInTheDocument();
    expect(screen.getByText("Haute")).toBeInTheDocument();
  });

  it("shows the fallback label when the task is not assigned", () => {
    render(<TaskCard task={{ ...task, assignee: null }} />);

    expect(screen.getByText("Responsable : Non affecte")).toBeInTheDocument();
  });
});
