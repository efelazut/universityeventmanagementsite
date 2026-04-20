import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { RatingStars } from "../components/RatingStars";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchClubs } from "../services/resourceService";

const clubFallbackImage = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80";

function normalizeClub(item = {}) {
  return {
    id: Number(item.id) || 0,
    name: String(item.name || "Kulüp adı güncelleniyor"),
    category: String(item.category || ""),
    description: String(item.description || "Kulüp açıklaması henüz eklenmedi."),
    showcaseSummary: String(item.showcaseSummary || ""),
    bannerUrl: String(item.bannerUrl || ""),
    avatarUrl: String(item.avatarUrl || ""),
    memberCount: Number(item.memberCount) || 0,
    averageRating: Number(item.averageRating) || 0,
    reviewCount: Number(item.reviewCount) || 0,
    isActive: Boolean(item.isActive),
    recentEventTitles: Array.isArray(item.recentEventTitles) ? item.recentEventTitles.filter(Boolean).map((value) => String(value)) : []
  };
}

export function ClubsPage() {
  const { apiBaseUrl } = useAuth();
  const clubsQuery = useAsyncData(async () => {
    try {
      return await fetchClubs(apiBaseUrl);
    } catch (error) {
      console.error("[ClubsPage] public clubs request failed", {
        endpoint: "/api/Clubs",
        message: error?.message || error
      });
      throw error;
    }
  }, [apiBaseUrl]);

  if (clubsQuery.loading) {
    return <div className="loading-state loading-state-large">Kulüpler hazırlanıyor...</div>;
  }

  if (clubsQuery.error) {
    return (
      <SectionCard title="Kulüpler yüklenemedi" description="Liste şu anda alınamıyor.">
        <EmptyState title="Kulüp verisine ulaşılamadı." description={clubsQuery.error || "Daha sonra tekrar deneyin."} icon="Kl" />
      </SectionCard>
    );
  }

  const clubs = Array.isArray(clubsQuery.data) ? clubsQuery.data.filter(Boolean).map(normalizeClub) : [];
  const activeClubs = clubs.filter((club) => club.isActive);

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Kulüpler</p>
          <h1>Kampüs toplulukları</h1>
          <p>Kulüpleri güvenli ve sade bir listede inceleyin.</p>
        </div>
        <div className="hero-metrics hero-metrics-compact">
          <StatCard title="Toplam Kulüp" value={clubs.length} accent="teal" subtitle="Listede" />
          <StatCard title="Aktif Kulüp" value={activeClubs.length} accent="blue" subtitle="Görünür topluluk" />
        </div>
      </section>

      <SectionCard title="Kulüp Vitrini" description="Topluluk kartları.">
        {clubs.length ? (
          <div className="club-showcase-grid">
            {clubs.map((club) => (
              <article key={club.id || club.name} className="club-showcase-card">
                <div className="club-banner">
                  <img
                    src={club.bannerUrl || club.avatarUrl || clubFallbackImage}
                    alt={club.name}
                    onError={(event) => {
                      event.currentTarget.src = clubFallbackImage;
                    }}
                  />
                </div>
                <div className="club-showcase-header">
                  <img
                    src={club.avatarUrl || clubFallbackImage}
                    alt={club.name}
                    onError={(event) => {
                      event.currentTarget.src = clubFallbackImage;
                    }}
                  />
                  <div>
                    <span className={`pill ${club.isActive ? "tone-teal" : "tone-dark"}`}>{club.category || "Kulüp"}</span>
                    <h3>{club.name}</h3>
                  </div>
                </div>
                <p>{club.showcaseSummary || club.description}</p>
                <div className="club-meta-grid">
                  <div>
                    <span>Üye</span>
                    <strong>{club.memberCount}</strong>
                  </div>
                  <div>
                    <span>Puan</span>
                    <RatingStars value={club.averageRating} reviewCount={club.reviewCount} compact />
                  </div>
                </div>
                <div className="stack-list compact-list">
                  {club.recentEventTitles.length ? (
                    club.recentEventTitles.map((title) => (
                      <div key={`${club.id}-${title}`} className="list-row compact-row">
                        <strong>{title}</strong>
                      </div>
                    ))
                  ) : (
                    <EmptyState title="Henüz etkinlik yok." description="Yeni etkinlikler burada görünür." icon="Et" />
                  )}
                </div>
                <Link className="primary-button link-button" to={`/clubs/${club.id}`}>
                  Kulübü Görüntüle
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Kulüp bulunamadı." description="Kulüp verisi geldiğinde bu alan dolacak." icon="Kl" />
        )}
      </SectionCard>
    </div>
  );
}
