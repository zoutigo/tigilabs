"use client";

import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "../ui/button";
import type { CalendarViewMode } from "./calendar-utils";
import { formatRangeLabel } from "./calendar-utils";

const VIEW_LABELS: Record<CalendarViewMode, string> = {
  day: "Jour",
  week: "Semaine",
  month: "Mois",
  agenda: "Planning",
};

type CalendarHeaderProps = {
  mode: CalendarViewMode;
  anchor: Date;
  search: string;
  onModeChange: (mode: CalendarViewMode) => void;
  onNavigate: (direction: 1 | -1) => void;
  onToday: () => void;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
};

export function CalendarHeader({
  mode,
  anchor,
  search,
  onModeChange,
  onNavigate,
  onToday,
  onSearchChange,
  onCreate,
}: CalendarHeaderProps) {
  return (
    <div className="calendar-header">
      <div className="calendar-header-top">
        <div className="calendar-header-nav">
          <Button
            variant="ghost"
            onClick={() => onNavigate(-1)}
            aria-label="Precedent"
          >
            <ChevronLeft size={18} />
          </Button>
          <Button variant="secondary" onClick={onToday}>
            Aujourd&apos;hui
          </Button>
          <Button
            variant="ghost"
            onClick={() => onNavigate(1)}
            aria-label="Suivant"
          >
            <ChevronRight size={18} />
          </Button>
          <h2 className="calendar-range-label">
            {formatRangeLabel(mode, anchor)}
          </h2>
        </div>
        <Button onClick={onCreate}>
          <Plus size={16} />
          Nouveau rendez-vous
        </Button>
      </div>
      <div className="calendar-header-bottom">
        <div
          className="calendar-view-switch"
          role="tablist"
          aria-label="Vue de l'agenda"
        >
          {(Object.keys(VIEW_LABELS) as CalendarViewMode[]).map((view) => (
            <button
              key={view}
              type="button"
              role="tab"
              aria-selected={mode === view}
              className={`calendar-view-tab${mode === view ? " calendar-view-tab-active" : ""}`}
              onClick={() => onModeChange(view)}
            >
              {VIEW_LABELS[view]}
            </button>
          ))}
        </div>
        <label className="calendar-search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Rechercher dans l'agenda"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
