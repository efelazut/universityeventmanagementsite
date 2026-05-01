import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
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
    category: "all",
    club: "all",
    campus: "all",
    format: "all",
    fee: "all"
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
    clubs: [...new Map(events.filter((item) => item.clubId).map((item) => [item.clubId, item.clubName])).entries()],
    categories: [...new Set(events.map((item) => item.category).filter(Boolean))],
    campuses: [...new Set(events.map((item) => item.campus).filter(Boolean))]
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
      const matchesClub = filters.club === "all" || String(item.clubId) === filters.club;
      const matchesCampus = filters.campus === "all" || item.campus === filters.campus;
      const matchesFormat = filters.format === "all" || item.format === filters.format;
      const matchesFee =
        filters.fee === "all" ||
        (filters.fee === "free" && item.isFree) ||
        (filters.fee === "paid" && !item.isFree);

      return matchesSearch && matchesStatus && matchesCategory && matchesClub && matchesCampus && matchesFormat && matchesFee;
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
      <SectionCard title="Etkinlikler yüklenemedi" description="Liste şu anda alınamıyor.">
        <EmptyState title="Etkinlik verisine ulaşılamadı." description={eventsQuery.error || "Daha sonra tekrar deneyin."} icon="Et" />
      </SectionCard>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Etkinlikler</p>
          <h1>Kampüs Takvimi</h1>
        </div>
        <div className="hero-actions">
          {user && ["Admin", "ClubManager"].includes(user.role) ? (
            <Link className="primary-button link-button" to="/events/new">
              Yeni Etkinlik
            </Link>
          ) : null}
          <div className="status-panel">
            <strong>{filteredEvents.length} etkinlik</strong>
            <span>Filtreye göre görünen liste</span>
          </div>
        </div>
      </section>

      {myEventsQuery.error && user ? (
        <div className="notice-box">Kişisel etkinlik durumu geçici olarak alınamadı. Genel liste görünmeye devam ediyor.</div>
      ) : null}
      {feedback ? <div className={feedback.type === "error" ? "error-panel" : "notice-box"}>{feedback.text}</div> : null}

      <SectionCard title="Filtreler" description="Listeyi sadeleştirin.">
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
              {options.clubs.map(([clubId, name]) => (
                <option key={clubId} value={clubId}>{name}</option>
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
        <SectionCard title="Etkinlik Listesi" description="Duruma göre sıralanmış görünüm.">
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
        <EmptyState title="Etkinlik bulunamadı." description="Filtreleri gevşeterek daha geniş bir listeye dönebilirsiniz." icon="Et" />
      )}
    </div>
  );
}
