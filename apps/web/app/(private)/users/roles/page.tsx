import { RequirePermission } from "../../../../components/auth/require-permission";
import { RolesManagement } from "../../../../components/users/roles-management";

export default function RolesPage() {
  return (
    <RequirePermission permission="role.manage">
      <div className="toolbar">
        <p className="muted">
          Definir les droits de chaque role et gerer leurs noms.
        </p>
      </div>
      <RolesManagement />
    </RequirePermission>
  );
}
