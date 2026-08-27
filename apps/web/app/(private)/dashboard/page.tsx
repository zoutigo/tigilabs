import { TaskDashboard } from "../../../components/tasks/task-dashboard";

export default function DashboardPage() {
  return (
    <>
      <div className="toolbar">
        <div>
          <h2>Tableau de bord</h2>
          <p className="muted">Vue synthétique des opérations internes.</p>
        </div>
      </div>
      <TaskDashboard />
    </>
  );
}
