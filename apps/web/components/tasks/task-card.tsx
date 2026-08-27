import type { Task } from "@tigilabs/types";
import Link from "next/link";
import { TaskPriority } from "./task-priority";
import { TaskStatus } from "./task-status";

export function TaskCard({ task }: Readonly<{ task: Task }>) {
  return (
    <article className="card task-card">
      <div>
        <Link href={`/tasks/${task.id}`}>
          <h3>{task.title}</h3>
        </Link>
        <p className="muted">{task.description}</p>
        <p className="muted">
          Responsable : {task.assignee?.name ?? "Non affecte"}
        </p>
      </div>
      <div
        className="button-row"
        style={{ justifyContent: "flex-end", marginTop: 0 }}
      >
        <TaskStatus status={task.status} />
        <TaskPriority priority={task.priority} />
      </div>
    </article>
  );
}
