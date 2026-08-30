"use client";

import { Clock3, CheckCircle2, CircleAlert, ListTodo } from "lucide-react";
import Link from "next/link";
import { TaskList } from "../../../../components/tasks/task-list";
import { Metric } from "../../../../components/tasks/task-metric";
import { useMyTasks } from "../../../../hooks/use-tasks";

export default function MyTasksPage() {
  const { tasks } = useMyTasks();
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const todayTasks = tasks.filter(
    (task) =>
      task.status !== "DONE" &&
      task.dueDate &&
      new Date(task.dueDate).getTime() <= today.getTime() &&
      !task.isOverdue,
  );
  const overdueTasks = tasks.filter((task) => task.isOverdue);
  const upcomingTasks = tasks.filter(
    (task) =>
      task.status !== "DONE" &&
      task.dueDate &&
      new Date(task.dueDate).getTime() > today.getTime(),
  );
  const recentlyDone = tasks
    .filter((task) => task.status === "DONE")
    .sort(
      (a, b) =>
        new Date(b.completedAt ?? b.updatedAt ?? "").getTime() -
        new Date(a.completedAt ?? a.updatedAt ?? "").getTime(),
    )
    .slice(0, 5);

  return (
    <>
      <div className="breadcrumbs">
        <Link href="/tasks">Taches</Link>
        <span>/</span>
        <span>Mes taches</span>
      </div>
      <div className="toolbar">
        <div>
          <h2>Mes taches</h2>
          <p className="muted">
            Toutes les taches qui me sont affectees, tous groupes confondus.
          </p>
        </div>
      </div>

      <section className="task-kpis">
        <Metric
          icon={Clock3}
          label="A traiter aujourd'hui"
          subtitle="Taches"
          value={todayTasks.length}
        />
        <Metric
          icon={CircleAlert}
          label="En retard"
          subtitle="Taches"
          tone="danger"
          value={overdueTasks.length}
        />
        <Metric
          icon={ListTodo}
          label="A venir"
          subtitle="Taches"
          tone="blue"
          value={upcomingTasks.length}
        />
        <Metric
          icon={CheckCircle2}
          label="Terminees"
          subtitle="Recemment"
          tone="success"
          value={recentlyDone.length}
        />
      </section>

      <div className="my-tasks-grid">
        <TaskBucket
          icon={Clock3}
          title="A traiter aujourd'hui"
          tasks={todayTasks}
        />
        <TaskBucket icon={CircleAlert} title="En retard" tasks={overdueTasks} />
        <TaskBucket icon={ListTodo} title="A venir" tasks={upcomingTasks} />
        <TaskBucket
          icon={CheckCircle2}
          title="Terminees recemment"
          tasks={recentlyDone}
        />
      </div>
    </>
  );
}

function TaskBucket({
  icon: Icon,
  tasks,
  title,
}: Readonly<{
  icon: typeof Clock3;
  tasks: ReturnType<typeof useMyTasks>["tasks"];
  title: string;
}>) {
  return (
    <section className="task-bucket">
      <div className="panel-heading">
        <h3>
          <Icon size={18} />
          {title}
        </h3>
        <span className="badge badge-neutral">{tasks.length}</span>
      </div>
      {tasks.length ? (
        <TaskList tasks={tasks} />
      ) : (
        <p className="muted">Aucune tache.</p>
      )}
    </section>
  );
}
