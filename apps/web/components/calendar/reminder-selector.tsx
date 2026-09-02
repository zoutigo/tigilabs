"use client";

import type { EventReminder, ReminderChannel } from "@tigilabs/types";

const PRESETS: Array<{ label: string; minutesBefore: number }> = [
  { label: "5 minutes avant", minutesBefore: 5 },
  { label: "15 minutes avant", minutesBefore: 15 },
  { label: "30 minutes avant", minutesBefore: 30 },
  { label: "1 heure avant", minutesBefore: 60 },
  { label: "2 heures avant", minutesBefore: 120 },
  { label: "1 jour avant", minutesBefore: 1440 },
  { label: "2 jours avant", minutesBefore: 2880 },
  { label: "1 semaine avant", minutesBefore: 10080 },
];

type ReminderSelectorProps = {
  value: EventReminder[];
  onChange: (reminders: EventReminder[]) => void;
};

export function ReminderSelector({ value, onChange }: ReminderSelectorProps) {
  function toggle(minutesBefore: number, channel: ReminderChannel) {
    const exists = value.some(
      (reminder) =>
        reminder.minutesBefore === minutesBefore &&
        reminder.channel === channel,
    );

    if (exists) {
      onChange(
        value.filter(
          (reminder) =>
            !(
              reminder.minutesBefore === minutesBefore &&
              reminder.channel === channel
            ),
        ),
      );
      return;
    }

    onChange([...value, { minutesBefore, channel }]);
  }

  return (
    <div className="reminder-selector">
      {PRESETS.map((preset) => {
        const emailChecked = value.some(
          (reminder) =>
            reminder.minutesBefore === preset.minutesBefore &&
            reminder.channel === "EMAIL",
        );
        const inAppChecked = value.some(
          (reminder) =>
            reminder.minutesBefore === preset.minutesBefore &&
            reminder.channel === "IN_APP",
        );

        return (
          <div key={preset.minutesBefore} className="reminder-row">
            <span className="reminder-row-label">{preset.label}</span>
            <label className="reminder-checkbox">
              <input
                type="checkbox"
                checked={inAppChecked}
                onChange={() => toggle(preset.minutesBefore, "IN_APP")}
              />
              Notification
            </label>
            <label className="reminder-checkbox">
              <input
                type="checkbox"
                checked={emailChecked}
                onChange={() => toggle(preset.minutesBefore, "EMAIL")}
              />
              Email
            </label>
          </div>
        );
      })}
      {!value.length ? <p className="muted">Aucun rappel configure.</p> : null}
    </div>
  );
}
