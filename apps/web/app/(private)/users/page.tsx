import { UserCard } from "../../../components/users/user-card";
import { mockUsers } from "../../../lib/api/users";

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
      <div className="grid">
        {mockUsers.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </>
  );
}
