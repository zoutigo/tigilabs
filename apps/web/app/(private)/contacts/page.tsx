import { RequirePermission } from "../../../components/auth/require-permission";
import { ContactsManagement } from "../../../components/contacts/contacts-management";

export default function ContactsPage() {
  return (
    <RequirePermission permission="contact.manage">
      <div className="toolbar">
        <p className="muted">
          Consultez et traitez les demandes envoyees depuis le formulaire de
          contact public.
        </p>
      </div>
      <ContactsManagement />
    </RequirePermission>
  );
}
