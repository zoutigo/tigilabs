import { PrismaService } from "../../database/prisma.service";
import { AvailabilityService } from "./availability.service";

const prisma = {
  event: { findMany: jest.fn() },
};

describe("AvailabilityService", () => {
  let service: AvailabilityService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AvailabilityService(prisma as unknown as PrismaService);
  });

  it("returns no conflicts when there is no overlapping event", async () => {
    prisma.event.findMany.mockResolvedValue([]);

    const conflicts = await service.findConflicts({
      userIds: ["user-1"],
      startAt: new Date("2026-02-01T09:00:00.000Z"),
      endAt: new Date("2026-02-01T10:00:00.000Z"),
    });

    expect(conflicts).toEqual([]);
  });

  it("reports a conflict for a participant already booked on the slot", async () => {
    prisma.event.findMany.mockResolvedValue([
      {
        id: "event-1",
        title: "Autre reunion",
        organizerId: "user-2",
        startAt: new Date("2026-02-01T09:30:00.000Z"),
        endAt: new Date("2026-02-01T10:30:00.000Z"),
        organizer: { id: "user-2", name: "Bob" },
        participants: [{ userId: "user-1", user: { name: "Alice" } }],
      },
    ]);

    const conflicts = await service.findConflicts({
      userIds: ["user-1"],
      startAt: new Date("2026-02-01T09:00:00.000Z"),
      endAt: new Date("2026-02-01T10:00:00.000Z"),
    });

    expect(conflicts).toEqual([
      expect.objectContaining({
        userId: "user-1",
        conflictingEventId: "event-1",
      }),
    ]);
  });

  it("classifies availability as BUSY when more than one conflict exists", async () => {
    prisma.event.findMany.mockResolvedValue([
      {
        id: "event-1",
        title: "Reunion A",
        organizerId: "user-1",
        startAt: new Date("2026-02-01T09:00:00.000Z"),
        endAt: new Date("2026-02-01T09:30:00.000Z"),
        organizer: { id: "user-1", name: "Alice" },
        participants: [],
      },
      {
        id: "event-2",
        title: "Reunion B",
        organizerId: "user-1",
        startAt: new Date("2026-02-01T09:15:00.000Z"),
        endAt: new Date("2026-02-01T09:45:00.000Z"),
        organizer: { id: "user-1", name: "Alice" },
        participants: [],
      },
    ]);

    const [availability] = await service.getAvailability({
      userIds: ["user-1"],
      from: new Date("2026-02-01T09:00:00.000Z"),
      to: new Date("2026-02-01T10:00:00.000Z"),
    });

    expect(availability.status).toBe("BUSY");
    expect(availability.conflicts).toHaveLength(2);
  });

  describe("suggestSlots", () => {
    it("suggests the first free business-hours slot", async () => {
      prisma.event.findMany.mockResolvedValue([]);

      const suggestions = await service.suggestSlots({
        userIds: ["user-1"],
        durationMinutes: 30,
        searchFrom: new Date(2026, 1, 2, 8, 0), // Monday 08:00
        searchTo: new Date(2026, 1, 2, 19, 0),
      });

      expect(suggestions[0]).toEqual({
        startAt: new Date(2026, 1, 2, 8, 0).toISOString(),
        endAt: new Date(2026, 1, 2, 8, 30).toISOString(),
      });
    });

    it("skips a slot that overlaps an existing busy event", async () => {
      prisma.event.findMany.mockResolvedValue([
        {
          startAt: new Date(2026, 1, 2, 8, 0),
          endAt: new Date(2026, 1, 2, 9, 0),
        },
      ]);

      const suggestions = await service.suggestSlots({
        userIds: ["user-1"],
        durationMinutes: 30,
        searchFrom: new Date(2026, 1, 2, 8, 0),
        searchTo: new Date(2026, 1, 2, 19, 0),
      });

      expect(suggestions[0].startAt).toBe(
        new Date(2026, 1, 2, 9, 0).toISOString(),
      );
    });

    it("never suggests a slot outside business hours or on a weekend", async () => {
      prisma.event.findMany.mockResolvedValue([]);

      const suggestions = await service.suggestSlots({
        userIds: ["user-1"],
        durationMinutes: 30,
        searchFrom: new Date(2026, 1, 6, 18, 30), // Friday 18:30
        searchTo: new Date(2026, 1, 9, 12, 0), // Monday noon
        limit: 3,
      });

      for (const suggestion of suggestions) {
        const start = new Date(suggestion.startAt);
        expect(start.getDay()).not.toBe(0);
        expect(start.getDay()).not.toBe(6);
        expect(start.getHours()).toBeGreaterThanOrEqual(8);
      }
    });
  });
});
