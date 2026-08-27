import type { TaskStatus as TaskStatusType } from "@tigilabs/types";

const labels: Record<TaskStatusType, string> = {
  TODO: "A faire",
  IN_PROGRESS: "En cours",
  REVIEW: "Revue",
  DONE: "Terminee",
  ARCHIVED: "Archivee",
};

export function TaskStatus({ status }: Readonly<{ status: TaskStatusType }>) {
  const className =
    status === "DONE" ? "badge badge-success" : "badge badge-neutral";

  return <span className={className}>{labels[status]}</span>;
}
