import { LogOut, UserCircle } from "lucide-react";
import { Button } from "../ui/button";

export function UserMenu() {
  return (
    <div className="button-row" style={{ marginTop: 0 }}>
      <UserCircle size={22} />
      <span>Admin</span>
      <Button aria-label="Deconnexion" type="button" variant="ghost">
        <LogOut size={18} />
      </Button>
    </div>
  );
}
