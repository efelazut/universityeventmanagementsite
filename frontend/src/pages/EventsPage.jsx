import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { EventCard } from "../components/EventCard";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { deleteEvent, fetchEvents, fetchMyEvents } from "../services/resourceService";

function normalizeEvent(item = {}) {
  const organizerText = String(item.organizerText || item.clubName || "").trim();

  return {
    id: Number(item.id) || 0,
    title: String(item.title || "Etkinlik adi guncelleniyor"),
    clubName: String(item.clubName || organizerText || "Duzenleyen bilgisi yok"),
    organizerText,
    description: String(item.description || "Etkinlik aciklamasi henuz eklenmedi."),
    category: String(item.category || ""),
    campus: String(item.campus || ""),
    format: String(item.format || "Fiziksel"),
    imageUrl: String(item.imageUrl || ""),
    locationDetails: String(item.locationDetails || item.locationText || ""),
    roomName: String(item.roomName || ""),
    building: String(item.building || ""),
    computedStatus: String(item.computedStatus || item.status || "Upcoming"),
    status: String(item.status || "Upcoming"),
    isFree: Boolean(item.isFree),
    clubId: item.clubId == null ? null : Number(item.clubId) || null,
    roomId: item.roomId == null ? null : Number(item.roomId) || null,
    participantCount: item.participantCount == null ? null : Number(item.participantCount),
    sourceYear: item.sourceYear == null ? null : Number(item.sourceYear),
    isPastEvent: Boolean(item.isPastEvent),
    averageRating: Number(item.averageRating) || 0,
    registrationCount: Number(item.registrationCount) || 0,
    pendingRegistrationCount: Number(item.pendingRegistrationCount) || 0,
    requiresApproval: Boolean(item.requiresApproval),
    startDate: item.startDate || new Date().toISOString(),
    endDate: item.endDate || item.startDate || new Date().toISOString()
  };
}

export function EventsPage() {
  const { apiBaseUrl, user } = useAuth();
  const location = useLocation();
  const eventsQuery = useAsyncData(() => fetchEvents(apiBaseUrl), [apiBaseUrl]);
  const myEventsQuery = useAsyncData(
    () => (user?.token ? fetchMyEvents(user.token, apiBaseUrl) : Promise.resolve({ registeredEvents: [] })),
    [user?.token, apiBaseUrl]
  );
  const [feedback, setFeedback] = useState(location.state?.message ? { type: "success", text: location.state.message } : null);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    category: "all"
  });
  const [activeTimeline, setActiveTimeline] = useState("upcoming");

  const events = useMemo(() => {
    if (!Array.isArray(eventsQuery.data)) {
      return [];
    }

    return eventsQuery.data.filter(Boolean).map(normalizeEvent);
  }, [eventsQuery.data]);

  const canManageEvent = (event) =>
    Boolean(user && event?.id && (user.role === "Admin" || (user.role === "ClubManager" && user.clubId === event.clubId)));

  const options = useMemo(() => ({
    categories: [...new Set(events.map((item) => item.category).filter(Boolean))]
  }), [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((item) => {
      const searchValue = filters.search.trim().toLocaleLowerCase("tr-TR");
      const matchesSearch =
        !searchValue ||
        item.title.toLocaleLowerCase("tr-TR").includes(searchValue) ||
        item.clubName.toLocaleLowerCase("tr-TR").includes(searchValue) ||
        item.organizerText.toLocaleLowerCase("tr-TR").includes(searchValue) ||
        item.description.toLocaleLowerCase("tr-TR").includes(searchValue);

      const matchesStatus = filters.status === "all" || item.computedStatus === filters.status;
      const matchesCategory = filters.category === "all" || item.category === filters.category;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [events, filters]);

  const timelineEvents = useMemo(() => {
    const now = new Date();
    return {
      upcoming: filteredEvents.filter((item) => !item.isPastEvent && item.computedStatus !== "Completed" && new Date(item.endDate) >= now),
      past: filteredEvents.filter((item) => item.isPastEvent || item.computedStatus === "Completed" || new Date(item.endDate) < now)
    };
  }, [filteredEvents]);

  const visibleEvents = timelineEvents[activeTimeline] || [];

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Bu etkinligi silmek istediginize emin misiniz?");
    if (!confirmed) return;

    try {
      await deleteEvent(id, user.token, apiBaseUrl);
      setFeedback({ type: "success", text: "Etkinlik basariyla silindi." });
      await Promise.all([eventsQuery.reload(), myEventsQuery.reload()]);
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Etkinlik silinemedi." });
    }
  };

  if (eventsQuery.loading) {
    return <div className="loading-state loading-state-large">Etkinlikler hazirlaniyor...</div>;
  }

  if (eventsQuery.error) {
    return (
      <ErrorState
        title="Etkinlikler yuklenemedi"
        description="Etkinlik listesi su anda alinamiyor."
        error={eventsQuery.error}
        onRetry={eventsQuery.reload}
        icon="Et"
      />
    );
  }

  return (
    <div className="page-stack">
      {user && ["Admin", "ClubManager"].includes(user.role) ? (
        <div className="page-actions-row">
          <Link className="primary-button link-button" to="/events/new">
            Yeni Etkinlik
          </Link>
        </div>
      ) : null}

      {myEventsQuery.error && user ? (
        <div className="notice-box">Kisisel etkinlik durumu gecici olarak alinamadi. Genel liste gorunmeye devam ediyor.</div>
      ) : null}
      {feedback ? <div className={feedback.type === "error" ? "error-panel" : "notice-box"}>{feedback.text}</div> : null}

      <details className="filter-disclosure compact-filter-card">
        <summary>
          <span className="section-title-mark" aria-hidden="true" />
          <strong>Filtreler</strong>
          <small>{visibleEvents.length} etkinlik</small>
        </summary>
        <div className="filter-toolbar event-filter-toolbar">
          <label className="filter-field">
            <span>Ara</span>
            <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Etkinlik veya kulup adi" />
          </label>
          <label className="filter-field">
            <span>Durum</span>
            <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="all">Tumu</option>
              <option value="Upcoming">Yaklasan</option>
              <option value="Ongoing">Devam Eden</option>
              <option value="Completed">Gecmis</option>
              <option value="Cancelled">Iptal Edildi</option>
            </select>
          </label>
          <label className="filter-field">
            <span>Kategori</span>
            <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
              <option value="all">Tumu</option>
              {options.categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      </details>

      <div className="timeline-switcher" role="tablist" aria-label="Etkinlik zaman filtresi">
        <button
          type="button"
          className={activeTimeline === "upcoming" ? "is-active" : ""}
          onClick={() => setActiveTimeline("upcoming")}
        >
          Yaklaşan Etkinlikler <span>{timelineEvents.upcoming.length}</span>
        </button>
        <button
          type="button"
          className={activeTimeline === "past" ? "is-active" : ""}
          onClick={() => setActiveTimeline("past")}
        >
          Geçmiş Etkinlikler <span>{timelineEvents.past.length}</span>
        </button>
      </div>

      {visibleEvents.length ? (
        <SectionCard title={activeTimeline === "upcoming" ? `${visibleEvents.length} Yaklaşan Etkinlik` : `${visibleEvents.length} Geçmiş Etkinlik`}>
          <div className="event-grid featured-grid">
            {visibleEvents.map((item) => (
              <EventCard
                key={item.id || `${item.title}-${item.startDate}`}
                event={item}
                footer={
                  canManageEvent(item) ? (
                    <div className="inline-actions">
                      <Link className="ghost-button link-button" to={`/events/${item.id}/edit`}>
                        Duzenle
                      </Link>
                      <button className="ghost-button" type="button" onClick={() => handleDelete(item.id)}>
                        Sil
                      </button>
                    </div>
                  ) : null
                }
              />
            ))}
          </div>
        </SectionCard>
      ) : (
        <EmptyState title="Etkinlik bulunamadi." description="Diger zaman kutucuguna gecebilir veya filtreleri gevsetebilirsiniz." icon="Et" />
      )}
    </div>
  );
}
