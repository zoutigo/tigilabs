import { RecurrenceFrequency } from "@prisma/client";

export type RecurrenceRule = {
  frequency: RecurrenceFrequency;
  interval: number;
  byWeekday?: number[];
  until?: Date | null;
  count?: number | null;
};

export type Occurrence = { startAt: Date; endAt: Date };

const MAX_OCCURRENCES = 366;
const DEFAULT_WINDOW_MONTHS = 18;

/**
 * Materializes concrete occurrences for a recurrence rule. Bounded by
 * `until`/`count` when provided, otherwise capped to a rolling window so we
 * never generate an unbounded number of rows for an endless series.
 */
export function generateOccurrences(
  rule: RecurrenceRule,
  firstStart: Date,
  firstEnd: Date,
): Occurrence[] {
  const durationMs = firstEnd.getTime() - firstStart.getTime();
  const windowEnd = new Date(firstStart);
  windowEnd.setMonth(windowEnd.getMonth() + DEFAULT_WINDOW_MONTHS);
  const hardStop =
    rule.until && rule.until < windowEnd ? rule.until : windowEnd;
  const maxCount = rule.count ?? MAX_OCCURRENCES;

  const occurrences: Occurrence[] = [];
  const interval = Math.max(1, rule.interval || 1);

  if (rule.frequency === RecurrenceFrequency.CUSTOM) {
    const weekdays = rule.byWeekday?.length
      ? rule.byWeekday
      : [firstStart.getDay()];
    let weekCursor = startOfWeek(firstStart);

    while (occurrences.length < maxCount) {
      for (const weekday of [...weekdays].sort((a, b) => a - b)) {
        const candidate = addDays(weekCursor, weekday);
        if (candidate < firstStart) {
          continue;
        }
        if (candidate > hardStop || occurrences.length >= maxCount) {
          break;
        }
        occurrences.push(toOccurrence(candidate, durationMs));
      }
      weekCursor = addDays(weekCursor, 7 * interval);
      if (weekCursor > hardStop) {
        break;
      }
    }

    return occurrences;
  }

  let cursor = new Date(firstStart);

  while (cursor <= hardStop && occurrences.length < maxCount) {
    occurrences.push(toOccurrence(cursor, durationMs));

    switch (rule.frequency) {
      case RecurrenceFrequency.DAILY:
        cursor = addDays(cursor, interval);
        break;
      case RecurrenceFrequency.WEEKLY:
        cursor = addDays(cursor, 7 * interval);
        break;
      case RecurrenceFrequency.BIWEEKLY:
        cursor = addDays(cursor, 14);
        break;
      case RecurrenceFrequency.MONTHLY:
        cursor = addMonths(cursor, interval);
        break;
      case RecurrenceFrequency.YEARLY:
        cursor = addMonths(cursor, 12 * interval);
        break;
      default:
        return occurrences;
    }
  }

  return occurrences;
}

function toOccurrence(start: Date, durationMs: number): Occurrence {
  return {
    startAt: new Date(start),
    endAt: new Date(start.getTime() + durationMs),
  };
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function startOfWeek(date: Date) {
  return addDays(date, -date.getDay());
}
