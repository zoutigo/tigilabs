import { TaskFilters } from "../../../components/tasks/task-filters";
import { TaskForm } from "../../../components/tasks/task-form";
import { TaskList } from "../../../components/tasks/task-list";
import { mockTasks } from "../../../lib/api/tasks";

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
      <TaskFilters />
      <div className="grid" style={{ alignItems: "start", marginTop: 20 }}>
        <TaskList tasks={mockTasks} />
        <TaskForm />
      </div>
    </>
  );
}
