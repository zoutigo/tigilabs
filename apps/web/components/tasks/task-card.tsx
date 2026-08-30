import type { Task } from "@tigilabs/types";
import Link from "next/link";
import { TaskPriority } from "./task-priority";
import { TaskStatus } from "./task-status";

export function TaskCard({ task }: Readonly<{ task: Task }>) {
  const responsible = task.assignedTo ?? task.assignee;

  return (
    <article className="card task-card">
      <div>
        <Link href={`/tasks/${task.id}`}>
          <h3>{task.title}</h3>
        </Link>
        <p className="muted">{task.description}</p>
        <p className="muted">
          Responsable : {responsible?.name ?? "Non affecte"}
        </p>
        <p className="muted">
          Echeance :{" "}
          {task.dueDate
            ? new Date(task.dueDate).toLocaleDateString("fr-FR")
            : "Aucune"}
        </p>
      </div>
      <div className="button-row task-card-badges">
        {task.isOverdue ? (
          <span className="badge badge-danger">En retard</span>
        ) : null}
        <TaskStatus status={task.status} />
        <TaskPriority priority={task.priority} />
      </div>
    </article>
  );
}
