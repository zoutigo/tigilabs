import { UsersManagement } from "../../../components/users/users-management";

export default function UsersPage() {
  return (
    <>
      <div className="toolbar">
        <div>
          <h2>Utilisateurs</h2>
          <p className="muted">
            Gestion des comptes, rôles et responsabilités.
          </p>
        </div>
      </div>
      <UsersManagement />
    </>
  );
}
