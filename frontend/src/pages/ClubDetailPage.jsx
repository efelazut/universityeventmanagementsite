import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { EventCard } from "../components/EventCard";
import { FollowButton } from "../components/FollowButton";
import { ClubManagementSection } from "../components/ClubManagementSection";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { useCommunicationCenter } from "../context/CommunicationCenterContext";
import { useAsyncData } from "../hooks/useAsyncData";
import {
  addClubManager,
  deleteClub,
  fetchClubById,
  fetchClubEvents,
  fetchClubFollowStatus,
  fetchClubManagers,
  fetchClubStatistics,
  fetchUsers,
  followClub,
  removeClubManager,
  unfollowClub
} from "../services/resourceService";

function isOptionalAuthError(message) {
  const value = String(message || "").toLowerCase();
  return value.includes("401") || value.includes("unauthorized");
}

export function ClubDetailPage() {
  const { id } = useParams();
  const { apiBaseUrl, user } = useAuth();
  const { openMessages } = useCommunicationCenter();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [busyAction, setBusyAction] = useState("");
  const [managerModalOpen, setManagerModalOpen] = useState(false);
  const [pendingRemoveManager, setPendingRemoveManager] = useState(null);

  const club = useAsyncData(() => fetchClubById(id, apiBaseUrl), [id, apiBaseUrl]);
  const resolvedClubId = Number(club.data?.id) || 0;
  const managers = useAsyncData(() => (resolvedClubId ? fetchClubManagers(resolvedClubId, apiBaseUrl) : Promise.resolve([])), [resolvedClubId, apiBaseUrl]);
  const events = useAsyncData(() => (resolvedClubId ? fetchClubEvents(resolvedClubId, apiBaseUrl) : Promise.resolve([])), [resolvedClubId, apiBaseUrl]);
  const stats = useAsyncData(
    () => (resolvedClubId ? fetchClubStatistics(resolvedClubId, apiBaseUrl) : Promise.resolve({ eventCount: 0, totalRegistrations: 0 })),
    [resolvedClubId, apiBaseUrl]
  );
  const followStatus = useAsyncData(
    () => (resolvedClubId && user?.token ? fetchClubFollowStatus(resolvedClubId, user.token, apiBaseUrl) : Promise.resolve(null)),
    [resolvedClubId, user?.token, apiBaseUrl]
  );
  const users = useAsyncData(() => (user?.token ? fetchUsers(apiBaseUrl) : Promise.resolve([])), [user?.token, apiBaseUrl]);

  if (club.loading) {
    return <div className="loading-state loading-state-large">Kulüp sayfası hazırlanıyor...</div>;
  }

  if (club.error) {
    return (
      <ErrorState
        title="Kulüp bulunamadı veya yüklenemedi"
        description="Kulüp profil bilgileri şu anda alınamıyor."
        error={club.error}
        onRetry={club.reload}
        icon="Kl"
      />
    );
  }

  const clubData = club.data || {};
  const managerList = Array.isArray(managers.data) ? managers.data : [];
  const clubEvents = Array.isArray(events.data) ? events.data : [];
  const statsData = stats.data || { eventCount: 0, totalRegistrations: 0 };
  const userList = Array.isArray(users.data) ? users.data : [];
  const currentManager = managerList.find((manager) => manager.userId === user?.id);
  const canManageTeam = Boolean(user && (user.role === "Admin" || currentManager?.role === "President"));
  const canDeleteClub = Boolean(user && (user.role === "Admin" || currentManager?.role === "President"));
  const optionalError = [managers.error, events.error, stats.error, followStatus.error]
    .filter((error) => error && !isOptionalAuthError(error))
    .join(" ");

  const reloadClubState = async () => {
    await Promise.all([club.reload(), managers.reload(), stats.reload(), followStatus.reload()]);
  };

  const handleFollow = async () => {
    if (!user?.token) {
      navigate("/login");
      return;
    }

    setBusyAction("follow");
    try {
      await followClub(resolvedClubId, user.token, apiBaseUrl);
      setFeedback({ type: "success", text: "Kulüp takip edildi. Yeni etkinliklerde bildirim alacaksınız." });
      await followStatus.reload();
      await club.reload();
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Takip işlemi tamamlanamadı." });
    } finally {
      setBusyAction("");
    }
  };

  const handleUnfollow = async () => {
    setBusyAction("follow");
    try {
      await unfollowClub(resolvedClubId, user.token, apiBaseUrl);
      setFeedback({ type: "success", text: "Kulüp takipten çıkarıldı." });
      await followStatus.reload();
      await club.reload();
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Takipten çıkma işlemi tamamlanamadı." });
    } finally {
      setBusyAction("");
    }
  };

  const handleAddManager = async (userId) => {
    setBusyAction("manager");
    try {
      await addClubManager(resolvedClubId, { userId, role: "Manager" }, user.token, apiBaseUrl);
      setFeedback({ type: "success", text: "Yönetici eklendi." });
      setManagerModalOpen(false);
      await reloadClubState();
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Yönetici eklenemedi." });
    } finally {
      setBusyAction("");
    }
  };

  const handleRemoveManager = async () => {
    if (!pendingRemoveManager) return;
    setBusyAction("manager-remove");
    try {
      await removeClubManager(resolvedClubId, pendingRemoveManager.id, user.token, apiBaseUrl);
      setFeedback({ type: "success", text: "Yönetici ekipten çıkarıldı." });
      setPendingRemoveManager(null);
      await reloadClubState();
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Yönetici silinemedi." });
    } finally {
      setBusyAction("");
    }
  };

  const handleDeleteClub = async () => {
    setBusyAction("delete-club");
    try {
      await deleteClub(resolvedClubId, user.token, apiBaseUrl);
      navigate("/clubs", { replace: true, state: { notice: "Kulüp silindi." } });
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Kulüp silinemedi." });
      setBusyAction("");
    }
  };

  const handleMessage = async () => {
    try {
      await openMessages({
        clubId: resolvedClubId,
        subject: `${clubData.name} hakkında`,
        initialMessage: "Kulüp faaliyetleri hakkında bilgi rica ediyorum."
      });
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Kulübe mesaj gönderilemedi." });
    }
  };

  return (
    <div className="page-stack">
      <section className="club-hero">
        <div className="club-hero-media">
          <img src={clubData.bannerUrl || clubData.avatarUrl || "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"} alt={clubData.name || "Kulüp"} />
        </div>
        <div className="club-hero-content">
          <div className="club-showcase-header">
            <img src={clubData.avatarUrl || "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=320&q=80"} alt={clubData.name || "Kulüp"} />
            <div>
              <span className={`pill ${clubData.isActive ? "tone-teal" : "tone-dark"}`}>{clubData.category || "Kulüp"}</span>
              <h1>{clubData.name || "Kulüp bilgisi hazırlanıyor"}</h1>
            </div>
          </div>
          <p>{clubData.showcaseSummary || clubData.description || "Kulüp açıklaması hazırlanıyor."}</p>
          <div className="inline-actions">
            {user ? (
              <FollowButton
                status={followStatus.data}
                disabled={busyAction === "follow" || followStatus.loading}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
              />
            ) : (
              <Link className="primary-button link-button" to="/login">Takip Et</Link>
            )}
            {user ? <button className="ghost-button" type="button" onClick={handleMessage}>Mesaj Gönder</button> : null}
            {clubData.instagramUrl ? <a className="ghost-button link-button" href={clubData.instagramUrl} target="_blank" rel="noreferrer">Instagram</a> : null}
            {user?.role === "Admin" ? <Link className="ghost-button link-button" to={`/clubs/${clubData.id}/edit`}>Düzenle</Link> : null}
            {canDeleteClub ? <button className="ghost-button destructive-button" type="button" onClick={handleDeleteClub} disabled={busyAction === "delete-club"}>Kulübü Sil</button> : null}
          </div>
        </div>
      </section>

      {optionalError ? <div className="notice-box">Kulübe ait bazı yardımcı bilgiler şu anda yüklenemedi. Temel içerik görünmeye devam ediyor.</div> : null}
      {feedback ? <div className={feedback.type === "error" ? "error-panel" : "notice-box"}>{feedback.text}</div> : null}

      <ClubManagementSection
        managers={managerList}
        users={userList}
        canManage={canManageTeam}
        modalOpen={managerModalOpen}
        loading={busyAction === "manager"}
        onOpenModal={() => setManagerModalOpen(true)}
        onCloseModal={() => setManagerModalOpen(false)}
        onAssign={handleAddManager}
        onRemove={setPendingRemoveManager}
      />

      <SectionCard title="Etkinlikler" description="Kulübün etkinlik akışı.">
        {clubEvents.length ? (
          <div className="event-grid featured-grid">
            {clubEvents.map((event) => (
              <EventCard key={event.id} event={event} compact />
            ))}
          </div>
        ) : (
          <EmptyState title="Henüz etkinlik yok." description="Yeni etkinlikler burada listelenecek." icon="Et" />
        )}
      </SectionCard>

      <SectionCard title="Kulüp Özeti">
        <div className="stat-grid club-detail-stats">
          <StatCard title="Takipçi" value={followStatus.data?.followerCount ?? clubData.memberCount ?? 0} accent="teal" subtitle="Bildirim alacak kullanıcı" />
          <StatCard title="Etkinlik" value={statsData.eventCount || clubEvents.length} accent="blue" subtitle="Toplam üretim" />
          <StatCard title="Katılım" value={statsData.totalRegistrations || 0} accent="orange" subtitle="Etkinlik toplamı" />
          <StatCard title="Yönetici" value={managerList.length} accent="rose" subtitle="Yönetim ekibi" />
        </div>
      </SectionCard>

      <ConfirmDialog
        open={Boolean(pendingRemoveManager)}
        tone="warning"
        title="Yönetici silinsin mi?"
        description={`${pendingRemoveManager?.userFullName || "Bu kişi"} yönetim ekibinden çıkarılacak.`}
        confirmLabel="Yöneticiyi Sil"
        loading={busyAction === "manager-remove"}
        onCancel={() => setPendingRemoveManager(null)}
        onConfirm={handleRemoveManager}
      />
    </div>
  );
}
