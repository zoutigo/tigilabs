import { Plus } from "lucide-react";
import Link from "next/link";
import { TaskDashboard } from "../../../components/tasks/task-dashboard";
import { TaskWorkspace } from "../../../components/tasks/task-workspace";
import { Button } from "../../../components/ui/button";

export default function TasksPage({
  searchParams,
}: Readonly<{ searchParams?: { group?: string } }>) {
  return (
    <>
      <div className="toolbar">
        <p className="muted">
          Créer, affecter, prioriser et suivre le travail de l'équipe.
        </p>
        <Button asChild>
          <Link href="/tasks/new">
            <Plus size={17} />
            Nouvelle tache
          </Link>
        </Button>
      </div>
      <TaskDashboard />
      <TaskWorkspace initialGroupId={searchParams?.group} />
    </>
  );
}
