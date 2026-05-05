import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
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
      <ErrorState
        title="Kulüpler yüklenemedi"
        description="Kulüp listesi şu anda alınamıyor."
        error={clubsQuery.error}
        onRetry={clubsQuery.reload}
        icon="Kl"
      />
    );
  }

  const clubs = Array.isArray(clubsQuery.data) ? clubsQuery.data.filter(Boolean).map(normalizeClub) : [];

  return (
    <div className="page-stack">
      <div className="club-grid">
        {clubs.length ? (
          clubs.map((club) => (
            <article key={club.id || club.name} className="club-card">
              <div className="club-card-banner">
                <img
                  src={club.bannerUrl || club.avatarUrl || clubFallbackImage}
                  alt={club.name}
                  onError={(event) => {
                    event.currentTarget.src = clubFallbackImage;
                  }}
                />
              </div>
              <div className="club-card-body">
                <div className="club-card-header">
                  <img
                    className="club-card-logo"
                    src={club.avatarUrl || clubFallbackImage}
                    alt={club.name}
                    onError={(event) => {
                      event.currentTarget.src = clubFallbackImage;
                    }}
                  />
                  <div>
                    <h3 className="club-card-title">{club.name}</h3>
                    <span className={`pill ${club.isActive ? "tone-blue" : "tone-dark"}`}>{club.category || "Kulüp"}</span>
                  </div>
                </div>
                <p className="club-card-desc line-clamp-2">{club.showcaseSummary || club.description}</p>
                <div className="club-card-footer">
                  <div className="club-meta">
                    <strong>{club.memberCount} Üye</strong>
                  </div>
                  <Link className="ghost-button link-button" to={`/clubs/${club.id}`}>
                    Detay
                  </Link>
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState title="Kulüp bulunamadı." description="Kulüp verisi geldiğinde bu alan dolacak." icon="Kl" />
        )}
      </div>
    </div>
  );
}
