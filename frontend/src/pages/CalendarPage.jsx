import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchEvents } from "../services/resourceService";
import { formatEventTimeRange, getEventVisualState } from "../utils/eventPresentation";

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
  const currentMonthEventCount = useMemo(
    () =>
      allEvents.filter(
        (event) =>
          event.parsedStartDate.getFullYear() === currentMonth.getFullYear() &&
          event.parsedStartDate.getMonth() === currentMonth.getMonth()
      ).length,
    [allEvents, currentMonth]
  );

  const goToMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDay(today);
  };

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
      <section className="calendar-modern-hero">
        <div>
          <p className="eyebrow">Takvim</p>
          <h1>Etkinlik Takvimi</h1>
        </div>
        <div className="calendar-month-count">
          <span>Bu ay</span>
          <strong>{currentMonthEventCount}</strong>
          <small>etkinlik</small>
        </div>
      </section>

      <div className="calendar-modern-layout">
        <section className="modern-calendar-card">
          <div className="modern-calendar-head">
            <button className="calendar-arrow" type="button" onClick={() => goToMonth(-1)} aria-label="Önceki ay">
              ‹
            </button>
            <div>
              <h2>{currentMonth.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</h2>
              <span>{currentMonthEventCount} etkinlik planlandı</span>
            </div>
            <button className="calendar-arrow" type="button" onClick={() => goToMonth(1)} aria-label="Sonraki ay">
              ›
            </button>
          </div>

          <div className="modern-week-row">
            {["Pzt", "Sa", "Çr", "Pr", "Cu", "Ct", "Pz"].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="modern-month-grid">
            {monthDays.map((day) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const dayEvents = eventMap[day.toDateString()] || [];
              const hasEvents = dayEvents.length > 0;
              const isSelected = sameDay(day, selectedDay);
              const isToday = sameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  className={`modern-day ${isCurrentMonth ? "" : "is-muted"} ${hasEvents ? "has-event" : ""} ${isSelected ? "is-selected" : ""} ${isToday ? "is-today" : ""}`.trim()}
                  onClick={() => {
                    setSelectedDay(day);
                    if (!isCurrentMonth) {
                      setCurrentMonth(new Date(day.getFullYear(), day.getMonth(), 1));
                    }
                  }}
                  title={dayEvents.map((event) => event.title).join(", ")}
                >
                  <span>{day.getDate()}</span>
                  {hasEvents ? <small>{dayEvents.length}</small> : null}
                </button>
              );
            })}
          </div>

          <button className="calendar-today-button" type="button" onClick={goToToday}>
            Bugüne dön
          </button>
        </section>

        <section className="selected-day-panel">
          <div className="selected-day-head">
            <span>Seçili Gün</span>
            <h2>{selectedDay.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}</h2>
          </div>
          <div className="selected-event-list">
            {selectedEvents.length ? (
              selectedEvents.map((event) => {
                const state = getEventVisualState(event);
                return (
                  <Link key={event.id} className="selected-event-card" to={`/events/${event.id}`}>
                    <div>
                      <span className={`pill ${state.tone}`}>{state.label}</span>
                      <strong>{event.title}</strong>
                      <small>{event.clubName || event.organizerText || "Maltepe Üniversitesi"}</small>
                    </div>
                    <p>{formatEventTimeRange(event.startDate, event.endDate)}</p>
                    <span>{event.locationDetails || event.roomName || "Kampüs"}</span>
                  </Link>
                );
              })
            ) : allEvents.length ? (
              <EmptyState title="Bu gün için etkinlik yok." description="Etkinlik olan günler takvimde renkli görünür." />
            ) : (
              <EmptyState title="Takvimde gösterilecek etkinlik yok." description="Etkinlikler eklendiğinde burada listelenecek." />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
