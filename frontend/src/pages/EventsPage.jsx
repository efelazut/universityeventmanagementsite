import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { EventCard } from "../components/EventCard";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { deleteEvent, fetchEvents, fetchMyEvents } from "../services/resourceService";

export function EventsPage() {
  const { apiBaseUrl, user } = useAuth();
  const location = useLocation();
  const eventsQuery = useAsyncData(() => fetchEvents(apiBaseUrl), [apiBaseUrl]);
  const myEventsQuery = useAsyncData(
    () => (user ? fetchMyEvents(user.token, apiBaseUrl) : Promise.resolve({ registeredEvents: [] })),
    [user?.token, apiBaseUrl]
  );
  const [feedback, setFeedback] = useState(location.state?.message ? { type: "success", text: location.state.message } : null);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    category: "all",
    club: "all",
    campus: "all",
    format: "all",
    fee: "all"
  });

  const canManageEvent = (event) =>
    Boolean(user && (user.role === "Admin" || (user.role === "ClubManager" && user.clubId === event.clubId)));

  const options = useMemo(() => {
    const events = eventsQuery.data || [];
    return {
      clubs: [...new Map(events.map((item) => [item.clubId, item.clubName])).entries()],
      categories: [...new Set(events.map((item) => item.category).filter(Boolean))],
      campuses: [...new Set(events.map((item) => item.campus).filter(Boolean))]
    };
  }, [eventsQuery.data]);

  const filteredEvents = useMemo(() => {
    return (eventsQuery.data || []).filter((item) => {
      const matchesSearch =
        !filters.search ||
        item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.clubName.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.description.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus = filters.status === "all" || item.computedStatus === filters.status;
      const matchesCategory = filters.category === "all" || item.category === filters.category;
      const matchesClub = filters.club === "all" || String(item.clubId) === filters.club;
      const matchesCampus = filters.campus === "all" || item.campus === filters.campus;
      const matchesFormat = filters.format === "all" || item.format === filters.format;
      const matchesFee =
        filters.fee === "all" ||
        (filters.fee === "free" && item.isFree) ||
        (filters.fee === "paid" && !item.isFree);

      return matchesSearch && matchesStatus && matchesCategory && matchesClub && matchesCampus && matchesFormat && matchesFee;
    });
  }, [eventsQuery.data, filters]);

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

  if (eventsQuery.loading || myEventsQuery.loading) {
    return <div className="loading-state loading-state-large">Etkinlikler hazırlanıyor...</div>;
  }

  if (eventsQuery.error || myEventsQuery.error) {
    return <div className="error-panel">{eventsQuery.error || myEventsQuery.error}</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Etkinlik Akışı</p>
          <h1>Durumu ilk bakışta anlaşılan, büyük görselli etkinlik listesi.</h1>
          <p>Geçmiş, devam eden ve yaklaşan etkinlikler artık daha güçlü filtreler ve daha okunur kartlarla ayrışıyor.</p>
        </div>
        <div className="hero-actions">
          {user && ["Admin", "ClubManager"].includes(user.role) ? (
            <Link className="primary-button link-button" to="/events/new">
              Yeni Etkinlik Oluştur
            </Link>
          ) : null}
          <div className="status-panel">
            <strong>{filteredEvents.length} etkinlik</strong>
            <span>Filtreler güçlü, görünüm sade ve sunum kalitesinde tutuldu.</span>
          </div>
        </div>
      </section>

      {feedback ? <div className={feedback.type === "error" ? "error-panel" : "notice-box"}>{feedback.text}</div> : null}

      <SectionCard title="Filtreler" description="Kategori, kulüp, kampüs, format ve ücret yapısına göre görünümü sadeleştirin.">
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
          <label className="filter-field">
            <span>Kulüp</span>
            <select value={filters.club} onChange={(event) => setFilters({ ...filters, club: event.target.value })}>
              <option value="all">Tüm kulüpler</option>
              {options.clubs.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span>Kampüs</span>
            <select value={filters.campus} onChange={(event) => setFilters({ ...filters, campus: event.target.value })}>
              <option value="all">Tümü</option>
              {options.campuses.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span>Biçim</span>
            <select value={filters.format} onChange={(event) => setFilters({ ...filters, format: event.target.value })}>
              <option value="all">Tümü</option>
              <option value="Fiziksel">Fiziksel</option>
              <option value="Online">Online</option>
            </select>
          </label>
          <label className="filter-field">
            <span>Ücret</span>
            <select value={filters.fee} onChange={(event) => setFilters({ ...filters, fee: event.target.value })}>
              <option value="all">Tümü</option>
              <option value="free">Ücretsiz</option>
              <option value="paid">Ücretli</option>
            </select>
          </label>
        </div>
      </SectionCard>

      {filteredEvents.length ? (
        <SectionCard title="Etkinlik listesi" description="Kartlar görsel ağırlıklı, durum vurgulu ve hızlı karar vermeyi destekleyecek şekilde tasarlandı.">
          <div className="event-grid featured-grid">
            {filteredEvents.map((item) => (
              <EventCard
                key={item.id}
                event={item}
                footer={
                  canManageEvent(item) ? (
                    <div className="inline-actions">
                      <Link className="ghost-button link-button" to={`/events/${item.id}/edit`}>
                        Düzenle
                      </Link>
                      <button className="ghost-button" onClick={() => handleDelete(item.id)}>
                        Sil
                      </button>
                    </div>
                  ) : (
                    <span className="mini-metric">
                      {item.requiresApproval ? `${item.pendingRegistrationCount} bekleyen başvuru` : `${item.registrationCount} kayıt`}
                    </span>
                  )
                }
              />
            ))}
          </div>
        </SectionCard>
      ) : (
        <EmptyState title="Filtrelerle eşleşen etkinlik bulunamadı." description="Filtreleri gevşeterek daha geniş bir etkinlik akışına dönebilirsiniz." />
      )}
    </div>
  );
}
