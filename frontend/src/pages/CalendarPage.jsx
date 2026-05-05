import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchEvents } from "../services/resourceService";
import { getEventVisualState, formatEventTimeRange } from "../utils/eventPresentation";

function sameDay(left, right) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCalendarDays(currentMonth) {
  const firstDay = startOfMonth(currentMonth);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function parseEventDate(value) {
  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function CalendarPage() {
  const { apiBaseUrl } = useAuth();
  const eventsQuery = useAsyncData(() => fetchEvents(apiBaseUrl), [apiBaseUrl]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const allEvents = useMemo(() => {
    const rawEvents = Array.isArray(eventsQuery.data) ? eventsQuery.data : [];
    return rawEvents
      .map((event) => {
        const startDate = parseEventDate(event.startDate);
        const endDate = parseEventDate(event.endDate);

        if (!startDate || !endDate) {
          return null;
        }

        return {
          ...event,
          parsedStartDate: startDate,
          parsedEndDate: endDate
        };
      })
      .filter(Boolean);
  }, [eventsQuery.data]);

  const monthDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
  const eventMap = useMemo(() => {
    return allEvents.reduce((accumulator, event) => {
      const key = event.parsedStartDate.toDateString();
      accumulator[key] = accumulator[key] || [];
      accumulator[key].push(event);
      return accumulator;
    }, {});
  }, [allEvents]);
  const selectedEvents = useMemo(
    () => allEvents.filter((event) => sameDay(event.parsedStartDate, selectedDay)),
    [allEvents, selectedDay]
  );

    if (eventsQuery.loading) {
    return <div className="loading-state loading-state-large">Takvim hazırlanıyor...</div>;
  }

  if (eventsQuery.error) {
    return (
      <ErrorState
        title="Takvim yüklenemedi"
        description="Etkinlik takvimi şu anda alınamıyor."
        error={eventsQuery.error}
        onRetry={eventsQuery.reload}
        icon="Tk"
      />
    );
  }

  return (
    <div className="page-stack">
      <section className="page-hero page-hero-calendar">
        <div>
          <p className="eyebrow">Takvim</p>
          <h1>Kampüsteki etkinlikleri gün gün takip edin.</h1>
          <p>Etkinlik olan günler işaretlenir, bir gün seçildiğinde o günün tüm etkinlikleri listelenir.</p>
        </div>
        <div className="status-panel status-panel-wide">
          <span>Bu ay toplam etkinlik</span>
          <strong>{allEvents.filter((event) => event.parsedStartDate.getMonth() === currentMonth.getMonth()).length}</strong>
        </div>
      </section>

      <div className="calendar-layout calendar-layout-wide">
        <SectionCard
          title={currentMonth.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
          description="Takvim üzerinden planlarınızı yönetin."
          action={
            <div className="inline-actions">
              <button className="ghost-button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                Önceki Ay
              </button>
              <button className="ghost-button" onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                setSelectedDay(today);
              }}>
                Bugün
              </button>
              <button className="ghost-button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                Sonraki Ay
              </button>
            </div>
          }
        >
          <div className="month-grid">
            {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((label) => (
              <div key={label} className="month-grid-label">
                {label}
              </div>
            ))}
            {monthDays.map((day) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const dayEvents = eventMap[day.toDateString()] || [];
              const topEvent = dayEvents[0];
              const topState = topEvent ? getEventVisualState(topEvent) : null;

              return (
                <button
                  key={day.toISOString()}
                  className={`month-grid-day ${isCurrentMonth ? "" : "is-muted"} ${sameDay(day, selectedDay) ? "is-selected" : ""}`.trim()}
                  onClick={() => setSelectedDay(day)}
                  title={dayEvents.map((event) => event.title).join(", ")}
                >
                  <span className="month-grid-date">{day.getDate()}</span>
                  {dayEvents.length ? (
                    <div className="month-grid-events">
                      <span className={`calendar-dot ${topState?.tone || "tone-blue"}`} />
                      <small>{dayEvents.length} etkinlik</small>
                    </div>
                  ) : (
                    <small className="month-grid-empty">Boş</small>
                  )}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title={selectedDay.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
          description="Seçili günün etkinlikleri ve durum bilgisi."
        >
          <div className="stack-list">
            {selectedEvents.length ? (
              selectedEvents.map((event) => {
                const state = getEventVisualState(event);
                return (
                  <Link key={event.id} className="list-row" to={`/events/${event.id}`}>
                    <strong>{event.title}</strong>
                    <span>{event.clubName} • {formatEventTimeRange(event.startDate, event.endDate)}</span>
                    <span>{event.locationDetails || `${event.roomName || "Salon bilgisi yok"} / ${event.building || "Kampüs"}`}</span>
                    <span className={`pill ${state.tone}`}>{state.label}</span>
                  </Link>
                );
              })
            ) : allEvents.length ? (
              <EmptyState title="Bugün için etkinlik yok." description="Takvimde başka bir güne tıklayarak o günün planlarını görebilirsiniz." />
            ) : (
              <EmptyState title="Takvimde gösterilecek etkinlik yok." description="Etkinlikler eklendiğinde burada otomatik olarak listelenecek." />
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
