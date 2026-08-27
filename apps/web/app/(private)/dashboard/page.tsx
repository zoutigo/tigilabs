import { TaskList } from "../../../components/tasks/task-list";
import { mockTasks } from "../../../lib/api/tasks";

export default function DashboardPage() {
  return (
    <>
      <div className="toolbar">
        <div>
          <h2>Tableau de bord</h2>
          <p className="muted">Vue synthétique des opérations internes.</p>
        </div>
      </div>
      <div className="grid">
        <article className="card">
          <h3>Taches ouvertes</h3>
          <strong>
            {mockTasks.filter((task) => task.status !== "DONE").length}
          </strong>
        </article>
        <article className="card">
          <h3>Urgences</h3>
          <strong>
            {mockTasks.filter((task) => task.priority === "URGENT").length}
          </strong>
        </article>
        <article className="card">
          <h3>Utilisateurs actifs</h3>
          <strong>8</strong>
        </article>
      </div>
      <section style={{ marginTop: 28 }}>
        <TaskList tasks={mockTasks.slice(0, 3)} />
      </section>
    </>
  );
}
