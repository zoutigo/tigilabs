import type { Task } from "@tigilabs/types";
import { TaskCard } from "./task-card";

export function TaskList({ tasks }: Readonly<{ tasks: Task[] }>) {
  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
