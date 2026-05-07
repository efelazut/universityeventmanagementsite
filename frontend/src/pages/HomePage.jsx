import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { EventCard } from "../components/EventCard";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchHomeFeed } from "../services/resourceService";

export function HomePage() {
  const { apiBaseUrl } = useAuth();
  const feedQuery = useAsyncData(() => fetchHomeFeed(apiBaseUrl), [apiBaseUrl]);

  if (feedQuery.loading) {
    return <div className="loading-state loading-state-large">Ana sayfa hazırlanıyor...</div>;
  }

  if (feedQuery.error) {
    return (
      <ErrorState
        title="Ana sayfa verileri yüklenemedi"
        description="Etkinlik ve kulüp özetleri şu anda alınamıyor."
        error={feedQuery.error}
        onRetry={feedQuery.reload}
      />
    );
  }

  const feed = feedQuery.data || {
    activeClubCount: 0,
    upcomingEventCount: 0,
    totalParticipationCount: 0,
    activeStudentCount: 0,
    popularEvents: [],
    ongoingEvents: [],
    upcomingEvents: [],
    featuredClubs: []
  };

  return (
    <div className="page-stack">
      <SectionCard title="Öne Çıkan Etkinlikler">
        {feed.popularEvents.length ? (
          <div className="event-grid featured-grid">
            {feed.popularEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="Öne çıkan etkinlik yok." description="Yeni etkinlikler yayımlandığında bu alan güncellenecek." />
        )}
      </SectionCard>

      <div className="two-column">
        <SectionCard title="Devam Edenler">
          <div className="stack-list">
            {feed.ongoingEvents.length ? (
              feed.ongoingEvents.map((event) => (
                <Link key={event.id} className="list-row" to={`/events/${event.id}`}>
                  <strong>{event.title}</strong>
                  <span>{event.clubName} • {event.locationDetails || event.roomName}</span>
                  <span>Şu anda devam ediyor.</span>
                </Link>
              ))
            ) : (
              <EmptyState title="Şu anda devam eden etkinlik yok." description="Yeni canlı etkinlik başladığında burada görünür." />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Yaklaşanlar">
          <div className="stack-list">
            {feed.upcomingEvents.length ? (
              feed.upcomingEvents.slice(0, 5).map((event) => (
                <Link key={event.id} className="list-row" to={`/events/${event.id}`}>
                  <strong>{event.title}</strong>
                  <span>{event.clubName} • {new Date(event.startDate).toLocaleString("tr-TR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}</span>
                  <span>{event.format === "Online" ? "Online katılım" : event.locationDetails || `${event.roomName} / ${event.building}`}</span>
                </Link>
              ))
            ) : (
              <EmptyState title="Yaklaşan etkinlik bulunmuyor." description="Takvimde yeni planlar oluştuğunda burada görünür." />
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Öne Çıkan Kulüpler">
        <div className="club-grid">
          {feed.featuredClubs.map((club) => (
            <article key={club.id || club.name} className="club-card">
              <div className="club-card-banner">
                <img
                  src={club.bannerUrl || club.avatarUrl || "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"}
                  alt={club.name}
                  onError={(event) => {
                    event.currentTarget.src = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80";
                  }}
                />
              </div>
              <div className="club-card-body">
                <div className="club-card-header">
                  <img
                    className="club-card-logo"
                    src={club.avatarUrl || "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"}
                    alt={club.name}
                    onError={(event) => {
                      event.currentTarget.src = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80";
                    }}
                  />
                  <div>
                    <h3 className="club-card-title">{club.name}</h3>
                    <span className="pill tone-blue">{club.category || "Topluluk"}</span>
                  </div>
                </div>
                <p className="club-card-desc line-clamp-2">{club.showcaseSummary || club.description}</p>
                <div className="club-card-footer">
                  <div className="club-meta">
                    <strong>{club.memberCount} takipçi</strong>
                  </div>
                  <Link className="ghost-button link-button" to={`/clubs/${club.id}`}>
                    Detay
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
