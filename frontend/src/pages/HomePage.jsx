import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { EventCard } from "../components/EventCard";
import { RatingStars } from "../components/RatingStars";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
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
    return <div className="error-panel">{feedQuery.error}</div>;
  }

  const feed = feedQuery.data;

  return (
    <div className="page-stack">
      <section className="page-hero home-hero">
        <div>
          <p className="eyebrow">Maltepe Üniversitesi Yaşamı</p>
          <h1>Kampüste yaşayan, üreten ve görünür olan bir kulüp platformu.</h1>
          <p>Öne çıkan etkinlikler, güçlü kulüp vitrinleri ve yaklaşan kampüs akışı tek bakışta sunuluyor.</p>
          <div className="inline-actions">
            <Link className="primary-button link-button" to="/events">Etkinlikleri Aç</Link>
            <Link className="ghost-button link-button" to="/clubs">Kulüpleri Keşfet</Link>
          </div>
        </div>
        <div className="hero-metrics">
          <StatCard title="Aktif kulüp" value={feed.activeClubCount} accent="teal" subtitle="Kampüste üretimde olan topluluklar" />
          <StatCard title="Yaklaşan etkinlik" value={feed.upcomingEventCount} accent="blue" subtitle="Takvime işlenmiş planlar" />
          <StatCard title="Toplam katılım" value={feed.totalParticipationCount} accent="orange" subtitle="Platform genelindeki başvurular" />
          <StatCard title="Aktif öğrenci" value={feed.activeStudentCount} accent="rose" subtitle="Topluluklarda yer alan kullanıcılar" />
        </div>
      </section>

      <SectionCard title="Öne çıkan etkinlikler" description="İlgi seviyesi yüksek ve görsel olarak güçlü etkinlik seçkisi.">
        {feed.popularEvents.length ? (
          <div className="event-grid featured-grid">
            {feed.popularEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                footer={<span className="mini-metric">{event.registrationCount} kayıt</span>}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="Öne çıkan etkinlik yok." description="Yeni etkinlikler yayınlandığında vitrin burada dolacak." />
        )}
      </SectionCard>

      <div className="two-column">
        <SectionCard title="Devam eden etkinlikler" description="Şu anda kampüste aktif olan akışlar.">
          <div className="stack-list">
            {feed.ongoingEvents.length ? (
              feed.ongoingEvents.map((event) => (
                <Link key={event.id} className="list-row" to={`/events/${event.id}`}>
                  <strong>{event.title}</strong>
                  <span>{event.clubName} • {event.locationDetails || event.roomName}</span>
                  <span>Şu anda canlı olarak devam ediyor.</span>
                </Link>
              ))
            ) : (
              <EmptyState title="Şu anda devam eden etkinlik yok." description="Yeni canlı etkinlik başladığında burada görünecek." />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Yaklaşan etkinlikler" description="Takvimde yakın tarihte öne çıkan planlar.">
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
              <EmptyState title="Yaklaşan etkinlik bulunmuyor." description="Takvimde yeni planlar oluştuğunda bu alan güncellenecek." />
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Öne çıkan kulüpler" description="Kulüplerin üretimlerini ve topluluk enerjisini gösteren güçlü vitrin.">
        <div className="club-showcase-grid">
          {feed.featuredClubs.map((club) => (
            <article key={club.id} className="club-showcase-card">
              <div className="club-showcase-header">
                <img src={club.avatarUrl} alt={club.name} />
                <div>
                  <span className="pill tone-blue">{club.category || "Topluluk"}</span>
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
                  <span>Ortalama puan</span>
                  <RatingStars value={club.averageRating} reviewCount={club.reviewCount} compact />
                </div>
              </div>
              <div className="stack-list compact-list">
                {club.recentEventTitles.map((title) => (
                  <div key={`${club.id}-${title}`} className="list-row compact-row">
                    <strong>{title}</strong>
                  </div>
                ))}
              </div>
              <Link className="primary-button link-button" to={`/clubs/${club.id}`}>Kulübü Görüntüle</Link>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
