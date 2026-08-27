import { notFound } from "next/navigation";
import { mockUsers } from "../../../../lib/api/users";

export default function UserDetailPage({ params }: Readonly<{ params: { id: string } }>) {
  const user = mockUsers.find((item) => item.id === params.id);

  if (!user) {
    notFound();
  }

  return (
    <article className="card">
      <h2>{user.name}</h2>
      <p className="muted">{user.email}</p>
      <p>Role : {user.role ?? user.roles?.join(", ") ?? "Membre"}</p>
      <p>Statut : {user.status}</p>
    </article>
  );
}
