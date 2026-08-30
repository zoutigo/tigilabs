import { RequirePermission } from "../../../../components/auth/require-permission";
import { RolesManagement } from "../../../../components/users/roles-management";

export default function RolesPage() {
  return (
    <RequirePermission permission="role.manage">
      <div className="toolbar">
        <div>
          <h2>Roles et permissions</h2>
          <p className="muted">
            Definir les droits de chaque role et gerer leurs noms.
          </p>
        </div>
      </div>
      <RolesManagement />
    </RequirePermission>
  );
}
