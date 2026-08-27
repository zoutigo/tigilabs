import type { TaskStatus as TaskStatusType } from "@tigilabs/types";

const labels: Record<TaskStatusType, string> = {
  TODO: "A faire",
  IN_PROGRESS: "En cours",
  BLOCKED: "Bloquee",
  DONE: "Terminee",
};

export function TaskStatus({ status }: Readonly<{ status: TaskStatusType }>) {
  const className =
    status === "DONE"
      ? "badge badge-success"
      : status === "BLOCKED"
        ? "badge badge-danger"
        : status === "IN_PROGRESS"
          ? "badge badge-warning"
          : "badge badge-neutral";

  return <span className={className}>{labels[status]}</span>;
}
