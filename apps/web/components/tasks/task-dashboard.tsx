"use client";

import { AlertTriangle, CheckSquare, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Task } from "@tigilabs/types";
import { useTaskDashboard } from "../../hooks/use-tasks";
import { TaskPriority } from "./task-priority";
import { TaskStatus } from "./task-status";

export function TaskDashboard() {
  const { dashboard } = useTaskDashboard();

  if (!dashboard) {
    return (
      <section className="empty-state">
        <Loader2 size={20} />
        <p>Chargement du dashboard...</p>
      </section>
    );
  }

  return (
    <>
      <section className="task-kpis">
        <Metric label="A faire" value={dashboard.mine.todo} />
        <Metric label="En cours" value={dashboard.mine.inProgress} />
        <Metric
          label="En retard"
          tone="danger"
          value={dashboard.mine.overdue}
        />
        <Metric label="Bloquees" tone="danger" value={dashboard.mine.blocked} />
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <h3>
            <AlertTriangle size={18} />
            Taches urgentes
          </h3>
          <CompactTaskList tasks={dashboard.urgent} />
        </section>
        <section className="dashboard-panel">
          <h3>
            <Clock size={18} />
            Echeances proches
          </h3>
          <CompactTaskList tasks={dashboard.dueSoon} />
        </section>
        <section className="dashboard-panel dashboard-panel-wide">
          <h3>
            <CheckSquare size={18} />
            Activite recente
          </h3>
          {dashboard.recentActivity.length ? (
            <ol className="timeline compact">
              {dashboard.recentActivity.map((item) => (
                <li key={item.id}>
                  <time>
                    {new Date(item.createdAt).toLocaleString("fr-FR")}
                  </time>
                  <strong>{item.user?.name ?? "Utilisateur"}</strong>
                  <p>{item.action}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">Aucune activite recente.</p>
          )}
        </section>
      </div>
    </>
  );
}

function Metric({
  label,
  tone,
  value,
}: Readonly<{ label: string; tone?: "danger"; value: number }>) {
  return (
    <article className={`metric ${tone === "danger" ? "metric-danger" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function CompactTaskList({ tasks }: Readonly<{ tasks: Task[] }>) {
  if (!tasks.length) {
    return <p className="muted">Aucune tache.</p>;
  }

  return (
    <div className="compact-task-list">
      {tasks.map((task) => (
        <Link href={`/tasks/${task.id}`} key={task.id}>
          <span>
            <strong>{task.title}</strong>
            <small>{task.group?.name ?? "Groupe"}</small>
          </span>
          <span className="status-stack">
            <TaskPriority priority={task.priority} />
            <TaskStatus status={task.status} />
          </span>
        </Link>
      ))}
    </div>
  );
}
