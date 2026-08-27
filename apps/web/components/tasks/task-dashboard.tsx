"use client";

import {
  AlarmClock,
  CheckCircle2,
  ClipboardList,
  ListChecks,
  Loader2,
  MoreVertical,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { Task } from "@tigilabs/types";
import { useTaskDashboard, useTaskGroups } from "../../hooks/use-tasks";
import { TaskPriority } from "./task-priority";
import { TaskStatus } from "./task-status";

export function TaskDashboard() {
  const { dashboard } = useTaskDashboard();
  const { groups } = useTaskGroups();

  if (!dashboard) {
    return (
      <section className="empty-state">
        <Loader2 size={20} />
        <p>Chargement du dashboard...</p>
      </section>
    );
  }

  const completedTotal = groups.reduce(
    (total, group) => total + group.completedTasks,
    0,
  );

  return (
    <>
      <section className="task-kpis">
        <Metric
          icon={ClipboardList}
          label="Mes taches"
          subtitle="A faire"
          value={dashboard.mine.todo}
        />
        <Metric
          icon={ListChecks}
          label="En cours"
          subtitle="Taches"
          tone="blue"
          value={dashboard.mine.inProgress}
        />
        <Metric
          icon={AlarmClock}
          label="En retard"
          subtitle="Taches"
          tone="danger"
          value={dashboard.mine.overdue}
        />
        <Metric
          icon={CheckCircle2}
          label="Terminees"
          subtitle="Cette semaine"
          tone="success"
          value={completedTotal}
        />
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <PanelHeading title="Taches urgentes" />
          <CompactTaskList tasks={dashboard.urgent} variant="urgent" />
        </section>
        <section className="dashboard-panel">
          <PanelHeading title="Echeances proches" />
          <CompactTaskList tasks={dashboard.dueSoon} showDate />
        </section>
        <section className="dashboard-panel">
          <PanelHeading title="Progression des groupes" />
          <GroupProgress groups={groups.slice(0, 4)} />
        </section>
      </div>

      <section className="dashboard-panel dashboard-panel-wide">
        <PanelHeading title="Activite recente" />
        {dashboard.recentActivity.length ? (
          <ol className="timeline compact">
            {dashboard.recentActivity.slice(0, 4).map((item) => (
              <li key={item.id}>
                <time>{new Date(item.createdAt).toLocaleString("fr-FR")}</time>
                <strong>{item.user?.name ?? "Utilisateur"}</strong>
                <p>{item.action}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">Aucune activite recente.</p>
        )}
      </section>
    </>
  );
}

function Metric({
  icon: Icon,
  label,
  subtitle,
  tone,
  value,
}: Readonly<{
  icon: LucideIcon;
  label: string;
  subtitle: string;
  tone?: "blue" | "danger" | "success";
  value: number;
}>) {
  return (
    <article className={`metric ${tone ? `metric-${tone}` : ""}`}>
      <span className="metric-icon" aria-hidden="true">
        <Icon size={22} />
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{subtitle}</small>
    </article>
  );
}

function PanelHeading({ title }: Readonly<{ title: string }>) {
  return (
    <div className="panel-heading">
      <h3>{title}</h3>
      <button
        aria-label={`Options ${title}`}
        className="icon-button"
        type="button"
      >
        <MoreVertical size={17} />
      </button>
    </div>
  );
}

function CompactTaskList({
  showDate = false,
  tasks,
  variant,
}: Readonly<{
  showDate?: boolean;
  tasks: Task[];
  variant?: "urgent";
}>) {
  if (!tasks.length) {
    return <p className="muted">Aucune tache.</p>;
  }

  return (
    <div className="compact-task-list">
      {tasks.map((task) => (
        <Link
          className={variant === "urgent" ? "compact-task-urgent" : undefined}
          href={`/tasks/${task.id}`}
          key={task.id}
        >
          <span>
            <strong>{task.title}</strong>
            <small>{task.group?.name ?? "Groupe"}</small>
          </span>
          {showDate ? (
            <time>{formatDate(task.dueDate)}</time>
          ) : (
            <span className="status-stack">
              <TaskPriority priority={task.priority} />
              <TaskStatus status={task.status} />
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

function GroupProgress({
  groups,
}: Readonly<{
  groups: Array<{ id: string; name: string; progress: number }>;
}>) {
  if (!groups.length) {
    return <p className="muted">Aucun groupe actif.</p>;
  }

  return (
    <div className="group-progress-list">
      {groups.map((group) => (
        <div className="group-progress-item" key={group.id}>
          <div>
            <strong>{group.name}</strong>
            <span>{group.progress}%</span>
          </div>
          <span className="progress-track">
            <span style={{ width: `${group.progress}%` }} />
          </span>
        </div>
      ))}
      <Link className="panel-link" href="/tasks">
        Voir tous les groupes
      </Link>
    </div>
  );
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "-";
}
