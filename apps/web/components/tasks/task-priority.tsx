import type { TaskPriority as TaskPriorityType } from "@tigilabs/types";

const labels: Record<TaskPriorityType, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  URGENT: "Urgente"
};

export function TaskPriority({ priority }: Readonly<{ priority: TaskPriorityType }>) {
  const className =
    priority === "URGENT" ? "badge badge-danger" : priority === "HIGH" ? "badge badge-warning" : "badge badge-neutral";

  return <span className={className}>{labels[priority]}</span>;
}
