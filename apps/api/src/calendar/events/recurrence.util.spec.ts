import { RecurrenceFrequency } from "@prisma/client";
import { generateOccurrences } from "./recurrence.util";

describe("generateOccurrences", () => {
  it("generates daily occurrences at the given interval", () => {
    const start = new Date("2026-01-01T09:00:00.000Z");
    const end = new Date("2026-01-01T10:00:00.000Z");

    const occurrences = generateOccurrences(
      {
        frequency: RecurrenceFrequency.DAILY,
        interval: 2,
        until: new Date("2026-01-07T23:59:59.000Z"),
      },
      start,
      end,
    );

    expect(occurrences.map((o) => o.startAt.toISOString())).toEqual([
      "2026-01-01T09:00:00.000Z",
      "2026-01-03T09:00:00.000Z",
      "2026-01-05T09:00:00.000Z",
      "2026-01-07T09:00:00.000Z",
    ]);
    expect(
      occurrences.every(
        (o) => o.endAt.getTime() - o.startAt.getTime() === 3_600_000,
      ),
    ).toBe(true);
  });

  it("generates weekly occurrences preserving time of day and duration", () => {
    const start = new Date("2026-01-05T14:00:00.000Z"); // Monday
    const end = new Date("2026-01-05T15:30:00.000Z");

    const occurrences = generateOccurrences(
      { frequency: RecurrenceFrequency.WEEKLY, interval: 1, count: 3 },
      start,
      end,
    );

    expect(occurrences).toHaveLength(3);
    expect(occurrences[1].startAt.toISOString()).toBe(
      "2026-01-12T14:00:00.000Z",
    );
    expect(occurrences[2].startAt.toISOString()).toBe(
      "2026-01-19T14:00:00.000Z",
    );
  });

  it("generates custom weekday occurrences within the same interval window", () => {
    const start = new Date("2026-01-05T09:00:00.000Z"); // Monday
    const end = new Date("2026-01-05T10:00:00.000Z");

    const occurrences = generateOccurrences(
      {
        frequency: RecurrenceFrequency.CUSTOM,
        interval: 1,
        byWeekday: [1, 3, 5], // Mon, Wed, Fri
        count: 6,
      },
      start,
      end,
    );

    const isoDates = occurrences.map((o) =>
      o.startAt.toISOString().slice(0, 10),
    );
    expect(isoDates).toEqual([
      "2026-01-05",
      "2026-01-07",
      "2026-01-09",
      "2026-01-12",
      "2026-01-14",
      "2026-01-16",
    ]);
  });

  it("caps generation to a bounded window when neither until nor count is provided", () => {
    const start = new Date("2026-01-01T09:00:00.000Z");
    const end = new Date("2026-01-01T10:00:00.000Z");

    const occurrences = generateOccurrences(
      { frequency: RecurrenceFrequency.DAILY, interval: 1 },
      start,
      end,
    );

    expect(occurrences.length).toBeGreaterThan(0);
    expect(occurrences.length).toBeLessThanOrEqual(366);
    const last = occurrences[occurrences.length - 1].startAt;
    const monthsSpanned =
      (last.getFullYear() - start.getFullYear()) * 12 +
      (last.getMonth() - start.getMonth());
    expect(monthsSpanned).toBeLessThanOrEqual(18);
  });
});
