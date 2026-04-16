import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { RatingStars } from "../components/RatingStars";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchClubs } from "../services/resourceService";

export function ClubsPage() {
  const { apiBaseUrl } = useAuth();
  const clubsQuery = useAsyncData(() => fetchClubs(apiBaseUrl), [apiBaseUrl]);

  if (clubsQuery.loading) {
    return <div className="loading-state loading-state-large">Kulüpler hazırlanıyor...</div>;
  }

  if (clubsQuery.error) {
    return <div className="error-panel">{clubsQuery.error}</div>;
  }

  const clubs = Array.isArray(clubsQuery.data) ? clubsQuery.data : [];

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Kulüpler</p>
          <h1>Kampüs topluluklarını keşfedin.</h1>
          <p>Kulüplerin ne ürettiğini, son etkinliklerini ve topluluk kültürünü güçlü kart yapısı içinde inceleyin.</p>
        </div>
        <div className="hero-metrics hero-metrics-compact">
          <StatCard title="Toplam kulüp" value={clubs.length} accent="teal" subtitle="Listeye dahil topluluklar" />
          <StatCard title="Aktif kulüp" value={clubs.filter((club) => club.isActive).length} accent="blue" subtitle="Şu an üretimde olanlar" />
        </div>
      </section>

      <SectionCard title="Kulüp vitrini" description="Kulüplerin yaptığı işleri ve topluluk enerjisini canlı gösteren alan.">
        {clubs.length ? (
          <div className="club-showcase-grid">
            {clubs.map((club) => (
              <article key={club.id} className="club-showcase-card">
                <div className="club-banner">
                  <img src={club.bannerUrl || club.avatarUrl} alt={club.name} />
                </div>
                <div className="club-showcase-header">
                  <img src={club.avatarUrl} alt={club.name} />
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
                  {club.recentEventTitles?.length ? (
                    club.recentEventTitles.map((title) => (
                      <div key={`${club.id}-${title}`} className="list-row compact-row">
                        <strong>{title}</strong>
                      </div>
                    ))
                  ) : (
                    <EmptyState title="Henüz sergilenecek etkinlik yok." description="Yeni etkinliklerle bu alan dolacak." />
                  )}
                </div>
                <Link className="primary-button link-button" to={`/clubs/${club.id}`}>Kulübü Görüntüle</Link>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Kulüp bulunamadı." description="Kulüp verisi geldiğinde bu alan dolacak." />
        )}
      </SectionCard>
    </div>
  );
}
