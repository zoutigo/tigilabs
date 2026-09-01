import { EventDetail } from "../../../../components/calendar/event-detail";

export default function CalendarEventPage({
  params,
}: Readonly<{ params: { id: string } }>) {
  return (
    <>
      <div className="breadcrumbs">
        <span>Agenda</span>
        <span>/</span>
        <span>Detail</span>
      </div>
      <EventDetail eventId={params.id} />
    </>
  );
}
