import { TaskDashboard } from "../../../components/tasks/task-dashboard";
import { TaskWorkspace } from "../../../components/tasks/task-workspace";

export default function TasksPage() {
  return (
    <>
      <div className="toolbar">
        <div>
          <h2>Taches</h2>
          <p className="muted">
            Créer, affecter, prioriser et suivre le travail de l'équipe.
          </p>
        </div>
      </div>
      <TaskDashboard />
      <TaskWorkspace />
    </>
  );
}
