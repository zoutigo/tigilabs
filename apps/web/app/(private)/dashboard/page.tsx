"use client";

import { AlarmClock, ArrowRight, ClipboardList, Users } from "lucide-react";
import Link from "next/link";
import { UpcomingEventsWidget } from "../../../components/calendar/upcoming-events-widget";
import { useTaskDashboard } from "../../../hooks/use-tasks";
import { useUsers } from "../../../hooks/use-users";

export default function DashboardPage() {
  const { dashboard } = useTaskDashboard();
  const { users } = useUsers();
  const activeUsers = users.filter((user) => user.status === "ACTIVE").length;

  return (
    <>
      <div className="toolbar">
        <p className="muted">Vue synthétique des opérations internes.</p>
      </div>

      <div className="dashboard-grid">
        <UpcomingEventsWidget />

        <section className="dashboard-panel">
          <div className="panel-heading">
            <h3>
              <ClipboardList size={16} />
              Taches
            </h3>
          </div>
          {dashboard ? (
            <div className="module-summary">
              <div>
                <span>A faire</span>
                <strong>{dashboard.mine.todo}</strong>
              </div>
              <div>
                <span>En cours</span>
                <strong>{dashboard.mine.inProgress}</strong>
              </div>
              <div>
                <span className={dashboard.mine.overdue ? "text-danger" : ""}>
                  <AlarmClock size={13} />
                  En retard
                </span>
                <strong className={dashboard.mine.overdue ? "text-danger" : ""}>
                  {dashboard.mine.overdue}
                </strong>
              </div>
            </div>
          ) : (
            <p className="muted">Chargement...</p>
          )}
          <Link className="panel-link" href="/tasks">
            Voir le module <ArrowRight size={13} />
          </Link>
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <h3>
              <Users size={16} />
              Utilisateurs
            </h3>
          </div>
          <div className="module-summary">
            <div>
              <span>Comptes actifs</span>
              <strong>{activeUsers}</strong>
            </div>
          </div>
          <Link className="panel-link" href="/users">
            Voir le module <ArrowRight size={13} />
          </Link>
        </section>
      </div>
    </>
  );
}
