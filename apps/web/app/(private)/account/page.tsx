import { AccountOverview } from "../../../components/account/account-overview";

export default function AccountPage() {
  return (
    <>
      <div className="toolbar">
        <div>
          <h2>Mon compte</h2>
          <p className="muted">
            Consultez et modifiez vos informations personnelles.
          </p>
        </div>
      </div>
      <AccountOverview />
    </>
  );
}
