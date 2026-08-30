import { RequirePermission } from "../../../components/auth/require-permission";
import { UsersManagement } from "../../../components/users/users-management";

export default function UsersPage() {
  return (
    <RequirePermission permission="user.manage">
      <div className="toolbar">
        <p className="muted">Gestion des comptes, rôles et responsabilités.</p>
      </div>
      <UsersManagement />
    </RequirePermission>
  );
}
