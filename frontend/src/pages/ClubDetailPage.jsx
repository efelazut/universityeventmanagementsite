import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { EventCard } from "../components/EventCard";
import { RatingStars } from "../components/RatingStars";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { useCommunicationCenter } from "../context/CommunicationCenterContext";
import { useAsyncData } from "../hooks/useAsyncData";
import {
  assignClubOfficer,
  fetchClubById,
  fetchClubEvents,
  fetchClubMembers,
  fetchClubStatistics,
  joinClub,
  removeClubMembership
} from "../services/resourceService";

export function ClubDetailPage() {
  const { id } = useParams();
  const { apiBaseUrl, user } = useAuth();
  const { openMessages } = useCommunicationCenter();
  const club = useAsyncData(() => fetchClubById(id, apiBaseUrl), [id, apiBaseUrl]);
  const members = useAsyncData(() => fetchClubMembers(id, apiBaseUrl), [id, apiBaseUrl]);
  const events = useAsyncData(() => fetchClubEvents(id, apiBaseUrl), [id, apiBaseUrl]);
  const stats = useAsyncData(() => fetchClubStatistics(id, apiBaseUrl), [id, apiBaseUrl]);
  const [feedback, setFeedback] = useState(null);

  if ([club, members, events, stats].some((query) => query.loading)) {
    return <div className="loading-state loading-state-large">Kulüp sayfası hazırlanıyor...</div>;
  }

  if ([club, members, events, stats].some((query) => query.error)) {
    return <div className="error-panel">{club.error || members.error || events.error || stats.error}</div>;
  }

  const memberList = Array.isArray(members.data) ? members.data : [];
  const clubEvents = Array.isArray(events.data) ? events.data : [];
  const isMember = memberList.some((item) => item.userId === user?.id);
  const canManage = user && (user.role === "Admin" || memberList.some((item) => item.userId === user.id && item.role === "President"));

  const handleJoin = async () => {
    try {
      await joinClub(id, user.token, apiBaseUrl);
      setFeedback({ type: "success", text: "Kulübe katıldınız." });
      await members.reload();
      await club.reload();
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Kulübe katılım sağlanamadı." });
    }
  };

  const handleMessage = async () => {
    try {
      await openMessages({
        clubId: Number(id),
        subject: `${club.data.name} hakkında`,
        initialMessage: "Kulüp faaliyetleri hakkında bilgi rica ediyorum."
      });
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Kulübe mesaj gönderilemedi." });
    }
  };

  const promoteAssistant = async (userId) => {
    try {
      await assignClubOfficer(id, { userId, role: "Assistant" }, user.token, apiBaseUrl);
      setFeedback({ type: "success", text: "Kulüp yöneticisi atandı." });
      await members.reload();
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Yönetici atanamadı." });
    }
  };

  const removeMember = async (membershipId) => {
    try {
      await removeClubMembership(id, membershipId, user.token, apiBaseUrl);
      setFeedback({ type: "success", text: "Üyelik kaldırıldı." });
      await members.reload();
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Üyelik kaldırılamadı." });
    }
  };

  return (
    <div className="page-stack">
      <section className="club-hero">
        <div className="club-hero-media">
          <img src={club.data.bannerUrl || club.data.avatarUrl} alt={club.data.name} />
        </div>
        <div className="club-hero-content">
          <div className="club-showcase-header">
            <img src={club.data.avatarUrl} alt={club.data.name} />
            <div>
              <span className={`pill ${club.data.isActive ? "tone-teal" : "tone-dark"}`}>{club.data.category || "Kulüp"}</span>
              <h1>{club.data.name}</h1>
            </div>
          </div>
          <p>{club.data.showcaseSummary || club.data.description}</p>
          <div className="inline-actions">
            {user?.role === "Student" && !isMember ? <button className="primary-button" onClick={handleJoin}>Kulübe Katıl</button> : null}
            {user ? <button className="ghost-button" onClick={handleMessage}>Mesaj Gönder</button> : null}
            {user?.role === "Admin" ? <Link className="ghost-button link-button" to={`/clubs/${club.data.id}/edit`}>Kulübü Düzenle</Link> : null}
          </div>
        </div>
      </section>

      {feedback ? <div className={feedback.type === "error" ? "error-panel" : "notice-box"}>{feedback.text}</div> : null}

      <div className="stat-grid">
        <StatCard title="Aktif üye" value={stats.data.activeMemberCount} accent="teal" subtitle="Topluluğun aktif ağı" />
        <StatCard title="Etkinlik sayısı" value={stats.data.eventCount} accent="blue" subtitle="Kulübün üretim ritmi" />
        <StatCard title="Toplam kayıt" value={stats.data.totalRegistrations} accent="orange" subtitle="Katılım ilgisi" />
        <StatCard title="Kulüp puanı" value={<RatingStars value={club.data.averageRating} reviewCount={club.data.reviewCount} compact />} accent="rose" subtitle="Etkinlik değerlendirmeleri" />
      </div>

      <div className="two-column">
        <SectionCard title="Kulüp ekibi" description="Başkan, yardımcı yönetici ve üyeler tek listede görünür.">
          <div className="stack-list">
            {memberList.length ? (
              memberList.map((member) => (
                <div key={member.id} className="list-row list-row-split">
                  <div>
                    <strong>{member.userFullName}</strong>
                    <span>{member.userEmail}</span>
                    <span>{member.role}</span>
                  </div>
                  {canManage && member.role === "Member" ? (
                    <div className="inline-actions">
                      <button className="mini-button" onClick={() => promoteAssistant(member.userId)}>Yardımcı Yap</button>
                      <button className="ghost-button" onClick={() => removeMember(member.id)}>Çıkar</button>
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <EmptyState title="Henüz üyelik listesi yok." description="Kulübe üyeler katıldıkça bu alan güncellenecek." />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Kulübün vitrini" description="Topluluk ruhunu ve son üretimleri gösteren kısa alan.">
          <div className="insight-grid single-column-grid">
            <div className="insight-card">
              <strong>{club.data.highlightTitle || "Kulüp vizyonu"}</strong>
              <span>{club.data.description}</span>
            </div>
            <div className="insight-card">
              <strong>Başkan</strong>
              <span>{club.data.presidentName} • {club.data.presidentEmail}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Son etkinlikler" description="Kulübün yaptığı işleri büyük görsellerle sergileyen alan.">
        {clubEvents.length ? (
          <div className="event-grid featured-grid">
            {clubEvents.map((event) => (
              <EventCard key={event.id} event={event} compact />
            ))}
          </div>
        ) : (
          <EmptyState title="Henüz etkinlik yok." description="Kulüp yeni etkinlik oluşturduğunda burada listelenecek." />
        )}
      </SectionCard>
    </div>
  );
}
