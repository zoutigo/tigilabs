import { MobileMenu } from "./mobile-menu";
import { UserMenu } from "./user-menu";

export function Header() {
  return (
    <header className="header">
      <div>
        <h1>Espace interne</h1>
        <span className="muted">Gestion Tigilabs</span>
      </div>
      <UserMenu />
      <MobileMenu />
    </header>
  );
}
