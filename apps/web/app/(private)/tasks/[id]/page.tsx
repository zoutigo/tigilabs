import { notFound } from "next/navigation";
import { TaskPriority } from "../../../../components/tasks/task-priority";
import { TaskStatus } from "../../../../components/tasks/task-status";
import { mockTasks } from "../../../../lib/api/tasks";

export default function TaskDetailPage({ params }: Readonly<{ params: { id: string } }>) {
  const task = mockTasks.find((item) => item.id === params.id);

  if (!task) {
    notFound();
  }

  return (
    <article className="card">
      <div className="toolbar">
        <div>
          <h2>{task.title}</h2>
          <p className="muted">{task.description}</p>
        </div>
        <div className="button-row" style={{ marginTop: 0 }}>
          <TaskStatus status={task.status} />
          <TaskPriority priority={task.priority} />
        </div>
      </div>
      <p>Responsable : {task.assignee?.name ?? "Non affecte"}</p>
      <p>Echeance : {task.dueDate ? new Date(task.dueDate).toLocaleDateString("fr-FR") : "Aucune"}</p>
    </article>
  );
}
