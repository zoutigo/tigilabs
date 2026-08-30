import { Header } from "../../components/layout/header";
import { Sidebar } from "../../components/layout/sidebar";
import { CurrentUserProvider } from "../../components/providers/current-user-provider";

export default function PrivateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <CurrentUserProvider>
      <div className="private-shell">
        <Sidebar />
        <main className="private-main">
          <Header />
          <div className="private-content">{children}</div>
        </main>
      </div>
    </CurrentUserProvider>
  );
}
