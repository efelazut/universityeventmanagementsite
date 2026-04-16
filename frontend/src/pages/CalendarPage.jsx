import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
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
    return <div className="loading-state loading-state-large">Takvim hazirlaniyor...</div>;
  }

  if (eventsQuery.error) {
    return <div className="error-panel">{eventsQuery.error}</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-hero page-hero-calendar">
        <div>
          <p className="eyebrow">Takvim</p>
          <h1>Kampusteki etkinlikleri gun gun takip edin.</h1>
          <p>Etkinlik olan gunler izgara uzerinde isaretlenir, bir gun secildiginde sag tarafta o gunun tum etkinlikleri listelenir.</p>
        </div>
        <div className="status-panel status-panel-wide">
          <span>Bu ay toplam etkinlik</span>
          <strong>{allEvents.filter((event) => event.parsedStartDate.getMonth() === currentMonth.getMonth()).length}</strong>
          <small>Veri gelmese bile takvim bos durumla calisir ve sayfayi bozmaz.</small>
        </div>
      </section>

      <div className="calendar-layout calendar-layout-wide">
        <SectionCard
          title={currentMonth.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
          description="Takvim dekoratif degil; gun secimi ve etkinlik yogunlugunu gosteren aktif bir planlama alani."
          action={
            <div className="inline-actions">
              <button className="ghost-button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                Onceki Ay
              </button>
              <button className="ghost-button" onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                setSelectedDay(today);
              }}>
                Bugun
              </button>
              <button className="ghost-button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                Sonraki Ay
              </button>
            </div>
          }
        >
          <div className="month-grid">
            {["Pzt", "Sal", "Car", "Per", "Cum", "Cmt", "Paz"].map((label) => (
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
                    <small className="month-grid-empty">Bos</small>
                  )}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title={selectedDay.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
          description="Secili gunun etkinlikleri, durum bilgisi ve hizli gecis baglantilari."
        >
          <div className="stack-list">
            {selectedEvents.length ? (
              selectedEvents.map((event) => {
                const state = getEventVisualState(event);
                return (
                  <Link key={event.id} className="list-row" to={`/events/${event.id}`}>
                    <strong>{event.title}</strong>
                    <span>{event.clubName} • {formatEventTimeRange(event.startDate, event.endDate)}</span>
                    <span>{event.locationDetails || `${event.roomName || "Salon bilgisi yok"} / ${event.building || "Kampus"}`}</span>
                    <span className={`pill ${state.tone}`}>{state.label}</span>
                  </Link>
                );
              })
            ) : allEvents.length ? (
              <EmptyState title="Bu gun icin etkinlik yok." description="Takvimde baska bir gune tiklayarak o gunun planlarini gorebilirsiniz." />
            ) : (
              <EmptyState title="Takvimde gosterilecek etkinlik yok." description="Etkinlikler eklendiginde burada otomatik olarak listelenecek." />
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
