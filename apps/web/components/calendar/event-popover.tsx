"use client";

import { CalendarClock, MapPin, Trash2, Users, Video } from "lucide-react";
import Link from "next/link";
import type { CalendarEvent, ParticipantStatus } from "@tigilabs/types";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";
import { formatEventTime } from "./calendar-utils";

type EventPopoverProps = {
  event: CalendarEvent | null;
  currentUserId?: string;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
  onRespond: (event: CalendarEvent, status: ParticipantStatus) => void;
};

export function EventPopover({
  event,
  currentUserId,
  onClose,
  onEdit,
  onDelete,
  onRespond,
}: EventPopoverProps) {
  if (!event) {
    return null;
  }

  const isOrganizer = event.organizerId === currentUserId;
  const myParticipation = event.participants.find(
    (p) => p.userId === currentUserId,
  );

  return (
    <Modal title={event.title} open onClose={onClose}>
      <div className="event-popover">
        {event.category ? (
          <span
            className="category-chip category-chip-active"
            style={{ borderColor: event.category.color }}
          >
            <span
              className="category-dot"
              style={{ background: event.category.color }}
            />
            {event.category.name}
          </span>
        ) : null}

        <p className="event-popover-row">
          <CalendarClock size={16} /> {formatEventTime(event)}
        </p>

        {event.location ? (
          <p className="event-popover-row">
            <MapPin size={16} /> {event.location}
          </p>
        ) : null}

        {event.meetingUrl ? (
          <p className="event-popover-row">
            <Video size={16} />
            <a href={event.meetingUrl} target="_blank" rel="noreferrer">
              {event.meetingUrl}
            </a>
          </p>
        ) : null}

        {event.participants.length > 1 ? (
          <p className="event-popover-row">
            <Users size={16} />
            {event.participants.map((p) => p.user.name).join(", ")}
          </p>
        ) : null}

        {event.description ? (
          <p className="muted">{event.description}</p>
        ) : null}

        {myParticipation && !isOrganizer ? (
          <div className="button-row">
            <Button
              variant="secondary"
              onClick={() => onRespond(event, "ACCEPTED")}
            >
              Accepter
            </Button>
            <Button
              variant="ghost"
              onClick={() => onRespond(event, "TENTATIVE")}
            >
              Peut-etre
            </Button>
            <Button
              variant="danger"
              onClick={() => onRespond(event, "DECLINED")}
            >
              Refuser
            </Button>
          </div>
        ) : null}

        <div className="button-row">
          <Link className="tl-button" href={`/calendar/${event.id}`}>
            Voir les details
          </Link>
          {isOrganizer ? (
            <>
              <Button variant="secondary" onClick={() => onEdit(event)}>
                Modifier
              </Button>
              <Button variant="danger" onClick={() => onDelete(event)}>
                <Trash2 size={14} /> Supprimer
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
