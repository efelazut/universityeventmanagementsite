import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { EventCard } from "../components/EventCard";
import { RatingStars } from "../components/RatingStars";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchOrganizerProfile } from "../services/resourceService";

function formatEventDate(value) {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

export function OrganizerProfilePage() {
  const { id } = useParams();
  const { apiBaseUrl } = useAuth();
  const profileQuery = useAsyncData(() => fetchOrganizerProfile(id, apiBaseUrl), [id, apiBaseUrl]);

  if (profileQuery.loading) {
    return <div className="loading-state loading-state-large">Yönetici profili hazırlanıyor...</div>;
  }

  if (profileQuery.error) {
    return (
      <SectionCard title="Yönetici profili şu anda açılamıyor" description="Temel bilgiler yeniden yüklenirken ekranı boş bırakmıyoruz.">
        <EmptyState title="Profil verisi yüklenemedi." description="Biraz sonra tekrar deneyebilir veya kulüp sayfasına dönebilirsiniz." />
      </SectionCard>
    );
  }

  const profile = profileQuery.data;
  const events = Array.isArray(profile?.events) ? profile.events : [];

  if (!profile) {
    return (
      <SectionCard title="Yönetici profili bulunamadı" description="Bu kullanıcı için herkese açık organizatör kaydı henüz hazır değil.">
        <EmptyState title="Profil görünmüyor." description="Kulüp sayfasına dönüp diğer organizatörleri inceleyebilirsiniz." />
      </SectionCard>
    );
  }

  return (
    <div className="page-stack">
      <section className="detail-hero detail-hero-rich organizer-hero">
        <div className="organizer-identity">
          <span className="profile-avatar profile-avatar-large">
            {profile.fullName
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0])
              .join("")}
          </span>
          <div className="organizer-identity-copy">
            <p className="eyebrow">Organizatör Profili</p>
            <h1>{profile.fullName}</h1>
            <p>{profile.bio || "Kulüp faaliyetlerini planlayan ve öğrenci topluluğunu bir araya getiren yönetici profili."}</p>
            <div className="badge-row">
              <span className="pill tone-dark">{profile.primaryClubName}</span>
              {profile.primaryClubCategory ? <span className="pill tone-gold">{profile.primaryClubCategory}</span> : null}
            </div>
          </div>
        </div>

        <div className="organizer-summary-card">
          <span className="sidebar-label">İletişim ve güven</span>
          <strong>{profile.email}</strong>
          <RatingStars value={profile.averageEventRating} reviewCount={profile.totalReviewCount} />
          <small>
            Yönetilen kulüpler: {profile.managedClubNames?.length ? profile.managedClubNames.join(", ") : profile.primaryClubName}
          </small>
        </div>
      </section>

      <div className="stat-grid">
        <StatCard title="Toplam etkinlik" value={profile.totalEventCount} accent="teal" subtitle="Yönetilen etkinlik portföyü" />
        <StatCard title="Ortalama puan" value={profile.averageEventRating?.toFixed(1) || "0.0"} accent="blue" subtitle="Katılımcı değerlendirmeleri" />
        <StatCard title="Toplam yorum" value={profile.totalReviewCount} accent="orange" subtitle="Etkinlik geri bildirim hacmi" />
        <StatCard title="Kulüp ağı" value={profile.managedClubNames?.length || 1} accent="rose" subtitle="Yönettiği kulüp sayısı" />
      </div>

      <div className="two-column">
        <SectionCard title="İtibar özeti" description="Organizatörün herkese açık yönettiği kulüpler ve etkinlik kalitesi.">
          <div className="detail-table">
            <div><span>Ana kulüp</span><strong>{profile.primaryClubName}</strong></div>
            <div><span>Kategori</span><strong>{profile.primaryClubCategory || "Genel kulüp yönetimi"}</strong></div>
            <div><span>Yönettiği kulüpler</span><strong>{profile.managedClubNames?.length ? profile.managedClubNames.join(", ") : profile.primaryClubName}</strong></div>
            <div><span>Ortalama değerlendirme</span><strong>{profile.averageEventRating?.toFixed(1) || "0.0"} / 5</strong></div>
          </div>
        </SectionCard>

        <SectionCard title="Son etkinlik performansı" description="Her etkinlik için tarih, kulüp ve puan özeti.">
          <div className="stack-list">
            {events.length ? (
              events.slice(0, 4).map((event) => (
                <Link key={event.id} className="list-row list-row-split" to={`/events/${event.id}`}>
                  <div>
                    <strong>{event.title}</strong>
                    <span>{event.clubName} • {formatEventDate(event.startDate)}</span>
                  </div>
                  <RatingStars value={event.averageRating} reviewCount={event.reviewCount} compact />
                </Link>
              ))
            ) : (
              <EmptyState title="Henüz herkese açık etkinlik özeti yok." description="Yeni etkinlik verileri geldikçe burada görünür." />
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Düzenlediği etkinlikler" description="Organizatör portföyünü oluşturan etkinlik kartları.">
        {events.length ? (
          <div className="event-grid featured-grid">
            {events.map((event) => (
              <EventCard key={event.id} event={event} compact />
            ))}
          </div>
        ) : (
          <EmptyState title="Etkinlik portföyü boş görünüyor." description="Kulüp yönetimi yeni etkinlik yayınladığında burada listelenecek." />
        )}
      </SectionCard>
    </div>
  );
}
