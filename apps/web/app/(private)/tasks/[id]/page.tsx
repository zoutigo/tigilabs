import { TaskDetail } from "../../../../components/tasks/task-detail";

export default function TaskDetailPage({
  params,
}: Readonly<{ params: { id: string } }>) {
  return <TaskDetail id={params.id} />;
}
