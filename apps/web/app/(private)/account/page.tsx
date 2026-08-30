import { AccountOverview } from "../../../components/account/account-overview";

export default function AccountPage() {
  return (
    <>
      <div className="toolbar">
        <p className="muted">
          Consultez et modifiez vos informations personnelles.
        </p>
      </div>
      <AccountOverview />
    </>
  );
}
