import type { User } from "@tigilabs/types";

type UserSelectProps = {
  users: User[];
  name?: string;
};

export function UserSelect({ users, name = "assignedToId" }: UserSelectProps) {
  return (
    <select name={name}>
      <option value="">Non affecte</option>
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.name}
        </option>
      ))}
    </select>
  );
}
