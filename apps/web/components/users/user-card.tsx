import type { User } from "@tigilabs/types";
import Link from "next/link";

export function UserCard({ user }: Readonly<{ user: User }>) {
  return (
    <article className="card">
      <Link href={`/users/${user.id}`}>
        <h3>{user.name}</h3>
      </Link>
      <p className="muted">{user.email}</p>
      <span className="badge badge-neutral">
        {user.role ?? user.roles?.join(", ") ?? "Membre"}
      </span>
    </article>
  );
}
