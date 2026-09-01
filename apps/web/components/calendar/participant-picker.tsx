"use client";

import { Search, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { User } from "@tigilabs/types";

type ParticipantPickerProps = {
  users: User[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  excludeUserId?: string;
};

export function ParticipantPicker({
  users,
  selectedIds,
  onChange,
  excludeUserId,
}: ParticipantPickerProps) {
  const [query, setQuery] = useState("");

  const candidates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users
      .filter(
        (user) => user.id !== excludeUserId && !selectedIds.includes(user.id),
      )
      .filter(
        (user) =>
          !needle ||
          user.name.toLowerCase().includes(needle) ||
          user.email.toLowerCase().includes(needle),
      )
      .slice(0, 6);
  }, [users, query, selectedIds, excludeUserId]);

  const selectedUsers = users.filter((user) => selectedIds.includes(user.id));

  function addParticipant(id: string) {
    onChange([...selectedIds, id]);
    setQuery("");
  }

  function removeParticipant(id: string) {
    onChange(selectedIds.filter((item) => item !== id));
  }

  return (
    <div className="participant-picker">
      <label className="calendar-search calendar-search-inline">
        <Search size={16} />
        <input
          type="text"
          placeholder="Ajouter un participant"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {query && candidates.length > 0 ? (
        <div className="participant-picker-suggestions">
          {candidates.map((user) => (
            <button
              type="button"
              key={user.id}
              className="participant-picker-suggestion"
              onClick={() => addParticipant(user.id)}
            >
              <span className="participant-avatar">{initials(user.name)}</span>
              <span className="participant-picker-suggestion-info">
                <strong>{user.name}</strong>
                <span className="muted">{user.email}</span>
              </span>
              <UserPlus size={16} />
            </button>
          ))}
        </div>
      ) : null}
      <div className="participant-picker-selected">
        {selectedUsers.map((user) => (
          <span key={user.id} className="participant-chip">
            <span className="participant-avatar">{initials(user.name)}</span>
            {user.name}
            <button
              type="button"
              aria-label={`Retirer ${user.name}`}
              onClick={() => removeParticipant(user.id)}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {!selectedUsers.length ? (
          <span className="muted">Aucun participant invite.</span>
        ) : null}
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
