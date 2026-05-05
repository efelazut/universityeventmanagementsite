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
  return {
    id: Number(item.id) || 0,
    title: String(item.title || "Etkinlik adı güncelleniyor"),
    clubName: String(item.clubName || "Kulüp bilgisi hazırlanıyor"),
    description: String(item.description || "Etkinlik açıklaması henüz eklenmedi."),
    category: String(item.category || ""),
    campus: String(item.campus || ""),
    format: String(item.format || "Fiziksel"),
    imageUrl: String(item.imageUrl || ""),
    locationDetails: String(item.locationDetails || ""),
    roomName: String(item.roomName || ""),
    building: String(item.building || ""),
    computedStatus: String(item.computedStatus || item.status || "Upcoming"),
    status: String(item.status || "Upcoming"),
    isFree: Boolean(item.isFree),
    clubId: Number(item.clubId) || 0,
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
        item.description.toLocaleLowerCase("tr-TR").includes(searchValue);

      const matchesStatus = filters.status === "all" || item.computedStatus === filters.status;
      const matchesCategory = filters.category === "all" || item.category === filters.category;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [events, filters]);

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Bu etkinliği silmek istediğinize emin misiniz?");
    if (!confirmed) return;

    try {
      await deleteEvent(id, user.token, apiBaseUrl);
      setFeedback({ type: "success", text: "Etkinlik başarıyla silindi." });
      await Promise.all([eventsQuery.reload(), myEventsQuery.reload()]);
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Etkinlik silinemedi." });
    }
  };

  if (eventsQuery.loading) {
    return <div className="loading-state loading-state-large">Etkinlikler hazırlanıyor...</div>;
  }

  if (eventsQuery.error) {
    return (
      <ErrorState
        title="Etkinlikler yüklenemedi"
        description="Etkinlik listesi şu anda alınamıyor."
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
        <div className="notice-box">Kişisel etkinlik durumu geçici olarak alınamadı. Genel liste görünmeye devam ediyor.</div>
      ) : null}
      {feedback ? <div className={feedback.type === "error" ? "error-panel" : "notice-box"}>{feedback.text}</div> : null}

      <details className="filter-disclosure compact-filter-card">
        <summary>
          <span className="section-title-mark" aria-hidden="true" />
          <strong>Filtreler</strong>
          <small>{filteredEvents.length} etkinlik</small>
        </summary>
        <div className="filter-toolbar event-filter-toolbar">
          <label className="filter-field">
            <span>Ara</span>
            <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Etkinlik veya kulüp adı" />
          </label>
          <label className="filter-field">
            <span>Durum</span>
            <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="all">Tümü</option>
              <option value="Upcoming">Yaklaşan</option>
              <option value="Ongoing">Devam Eden</option>
              <option value="Completed">Geçmiş</option>
              <option value="Cancelled">İptal Edildi</option>
            </select>
          </label>
          <label className="filter-field">
            <span>Kategori</span>
            <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
              <option value="all">Tümü</option>
              {options.categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      </details>

      {filteredEvents.length ? (
        <SectionCard title={`${filteredEvents.length} Etkinlik`}>
          <div className="event-grid featured-grid">
            {filteredEvents.map((item) => (
              <EventCard
                key={item.id || `${item.title}-${item.startDate}`}
                event={item}
                footer={
                  canManageEvent(item) ? (
                    <div className="inline-actions">
                      <Link className="ghost-button link-button" to={`/events/${item.id}/edit`}>
                        Düzenle
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
        <EmptyState title="Etkinlik bulunamadı." description="Filtreleri gevşeterek daha geniş bir listeye dönebilirsiniz." icon="Et" />
      )}
    </div>
  );
}
