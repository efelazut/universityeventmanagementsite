import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { EventCard } from "../components/EventCard";
import { RatingStars } from "../components/RatingStars";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { useCommunicationCenter } from "../context/CommunicationCenterContext";
import { useAsyncData } from "../hooks/useAsyncData";
import {
  assignClubOfficer,
  assignClubPresident,
  deleteClub,
  fetchClubById,
  fetchClubEvents,
  fetchClubMembers,
  fetchClubStatistics,
  joinClub,
  removeClubMembership
} from "../services/resourceService";

function getRoleLabel(role) {
  if (role === "President") return "Kulüp Başkanı";
  if (role === "Assistant") return "Yönetici";
  return "Üye";
}

function getRoleTone(role) {
  if (role === "President") return "tone-gold";
  if (role === "Assistant") return "tone-blue";
  return "tone-dark";
}

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
  const [pendingDialog, setPendingDialog] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const club = useAsyncData(async () => {
    try {
      return await fetchClubById(id, apiBaseUrl);
    } catch (error) {
      console.error("[ClubDetailPage] public club request failed", {
        endpoint: `/api/Clubs/${id}`,
        message: error?.message || error
      });
      throw error;
    }
  }, [id, apiBaseUrl]);
  const resolvedClubId = Number(club.data?.id) || 0;
  const members = useAsyncData(async () => {
    if (!resolvedClubId) {
      return [];
    }

    try {
      return await fetchClubMembers(resolvedClubId, apiBaseUrl);
    } catch (error) {
      console.error("[ClubDetailPage] optional club members request failed", {
        endpoint: `/api/Clubs/${resolvedClubId}/members`,
        message: error?.message || error,
        hasToken: Boolean(user?.token)
      });
      throw error;
    }
  }, [resolvedClubId, apiBaseUrl, user?.token]);
  const events = useAsyncData(async () => {
    if (!resolvedClubId) {
      return [];
    }

    try {
      return await fetchClubEvents(resolvedClubId, apiBaseUrl);
    } catch (error) {
      console.error("[ClubDetailPage] optional club events request failed", {
        endpoint: `/api/Clubs/${resolvedClubId}/events`,
        message: error?.message || error,
        hasToken: Boolean(user?.token)
      });
      throw error;
    }
  }, [resolvedClubId, apiBaseUrl, user?.token]);
  const stats = useAsyncData(async () => {
    if (!resolvedClubId) {
      return { activeMemberCount: 0, eventCount: 0, totalRegistrations: 0 };
    }

    try {
      return await fetchClubStatistics(resolvedClubId, apiBaseUrl);
    } catch (error) {
      console.error("[ClubDetailPage] optional club statistics request failed", {
        endpoint: `/api/Clubs/${resolvedClubId}/statistics`,
        message: error?.message || error,
        hasToken: Boolean(user?.token)
      });
      throw error;
    }
  }, [resolvedClubId, apiBaseUrl, user?.token]);

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
  const membersError = members.error && !isOptionalAuthError(members.error) ? members.error : "";
  const eventsError = events.error && !isOptionalAuthError(events.error) ? events.error : "";
  const statsError = stats.error && !isOptionalAuthError(stats.error) ? stats.error : "";
  const statsData = statsError ? { activeMemberCount: 0, eventCount: 0, totalRegistrations: 0 } : (stats.data || { activeMemberCount: 0, eventCount: 0, totalRegistrations: 0 });
  const memberList = membersError ? [] : (Array.isArray(members.data) ? members.data : []);
  const clubEvents = eventsError ? [] : (Array.isArray(events.data) ? events.data : []);
  const isMember = memberList.some((item) => item.userId === user?.id);
  const currentMembership = memberList.find((item) => item.userId === user?.id) || null;
  const isPresident = currentMembership?.role === "President";
  const isAssistant = currentMembership?.role === "Assistant";
  const canDeleteClub = Boolean(user && (user.role === "Admin" || isPresident));

  const groupedMembers = {
    president: memberList.find((member) => member.role === "President") || null,
    assistants: memberList.filter((member) => member.role === "Assistant"),
    members: memberList.filter((member) => member.role === "Member")
  };

  const showMemberAction = (member, action) => {
    if (!user || member.userId === user.id) return false;
    if (user.role === "Admin") {
      if (action === "promote") return member.role === "Member";
      if (action === "demote") return member.role === "Assistant";
      if (action === "transfer") return member.role !== "President";
      if (action === "remove") return member.role !== "President";
      return false;
    }

    if (isPresident) {
      if (action === "promote") return member.role === "Member";
      if (action === "demote") return member.role === "Assistant";
      if (action === "transfer") return member.role === "Assistant" || member.role === "Member";
      if (action === "remove") return member.role !== "President";
      return false;
    }

    if (isAssistant) {
      if (action === "promote") return member.role === "Member";
      if (action === "remove") return member.role === "Member";
    }

    return false;
  };

  const openRoleDialog = (dialog) => {
    setConfirmText("");
    setPendingDialog(dialog);
  };

  const closeDialog = () => {
    if (!busyAction) {
      setPendingDialog(null);
      setConfirmText("");
    }
  };

  const refreshClubState = async () => {
    await Promise.all([members.reload(), club.reload(), stats.reload()]);
  };

  const handleJoin = async () => {
    try {
      await joinClub(id, user.token, apiBaseUrl);
      setFeedback({ type: "success", text: "Kulübe katıldınız." });
      await refreshClubState();
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Kulübe katılım sağlanamadı." });
    }
  };

  const handleMessage = async () => {
    try {
      await openMessages({
        clubId: Number(id),
        subject: `${clubData.name} hakkında`,
        initialMessage: "Kulüp faaliyetleri hakkında bilgi rica ediyorum."
      });
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Kulübe mesaj gönderilemedi." });
    }
  };

  const runMembershipAction = async () => {
    if (!pendingDialog || !user) return;

    const { type, member } = pendingDialog;
    const actionKey = `${type}-${member?.id || "club"}`;
    setBusyAction(actionKey);
    setFeedback(null);

    try {
      if (type === "promote") {
        await assignClubOfficer(id, { userId: member.userId, role: "Assistant" }, user.token, apiBaseUrl);
        setFeedback({ type: "success", text: `${member.userFullName} yönetici yapıldı.` });
      }

      if (type === "demote") {
        await assignClubOfficer(id, { userId: member.userId, role: "Member" }, user.token, apiBaseUrl);
        setFeedback({ type: "success", text: `${member.userFullName} artık üye rolünde.` });
      }

      if (type === "transfer") {
        await assignClubPresident(id, member.userId, user.token, apiBaseUrl);
        setFeedback({ type: "success", text: `Başkanlık ${member.userFullName} kullanıcısına devredildi.` });
      }

      if (type === "remove") {
        await removeClubMembership(id, member.id, user.token, apiBaseUrl);
        setFeedback({ type: "success", text: "Üyelik kaldırıldı." });
      }

      if (type === "delete-club") {
        await deleteClub(id, user.token, apiBaseUrl);
        navigate("/clubs", { replace: true, state: { notice: "Kulüp ve bağlı etkinlikleri silindi." } });
        return;
      }

      await refreshClubState();
      setPendingDialog(null);
      setConfirmText("");
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "İşlem tamamlanamadı." });
    } finally {
      setBusyAction("");
    }
  };

  const dialogRequiresPhrase = pendingDialog?.type === "transfer";

  const renderMemberRow = (member, emphasize = false) => (
    <div key={member.id} className={`team-member-card ${emphasize ? "is-president" : ""}`}>
      <div className="team-member-main">
        <div className="team-member-avatar">{member.userFullName?.slice(0, 1) || "Ü"}</div>
        <div className="team-member-copy">
          <div className="team-member-head">
            <strong>{member.userFullName}</strong>
            <span className={`pill ${getRoleTone(member.role)}`}>{getRoleLabel(member.role)}</span>
          </div>
          <span>{member.userEmail}</span>
        </div>
      </div>

      <div className="team-member-actions">
        {member.role !== "Member" ? <Link className="ghost-button link-button" to={`/organizers/${member.userId}`}>Profili Aç</Link> : null}
        {showMemberAction(member, "promote") ? <button className="mini-button" type="button" onClick={() => openRoleDialog({ type: "promote", member })}>Yönetici Yap</button> : null}
        {showMemberAction(member, "demote") ? <button className="ghost-button" type="button" onClick={() => openRoleDialog({ type: "demote", member })}>Yetkiyi Kaldır</button> : null}
        {showMemberAction(member, "transfer") ? <button className="ghost-button" type="button" onClick={() => openRoleDialog({ type: "transfer", member })}>Başkan Yap</button> : null}
        {showMemberAction(member, "remove") ? <button className="ghost-button destructive-button" type="button" onClick={() => openRoleDialog({ type: "remove", member })}>Çıkar</button> : null}
      </div>
    </div>
  );

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
            {user?.role === "Student" && !isMember ? <button className="primary-button" type="button" onClick={handleJoin}>Kulübe Katıl</button> : null}
            {user ? <button className="ghost-button" type="button" onClick={handleMessage}>Mesaj Gönder</button> : null}
            {user?.role === "Admin" ? <Link className="ghost-button link-button" to={`/clubs/${clubData.id}/edit`}>Düzenle</Link> : null}
            {canDeleteClub ? (
              <button className="ghost-button destructive-button" type="button" onClick={() => openRoleDialog({ type: "delete-club" })} disabled={busyAction === "delete-club-club"}>
                {busyAction === "delete-club-club" ? "Siliniyor..." : "Kulübü Sil"}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {(membersError || eventsError || statsError) ? (
        <div className="notice-box">Kulübe ait bazı yardımcı bilgiler şu anda yüklenemedi. Temel kulüp içeriği görünmeye devam ediyor.</div>
      ) : null}
      {feedback ? <div className={feedback.type === "error" ? "error-panel" : "notice-box"}>{feedback.text}</div> : null}

      <div className="two-column">
        <SectionCard title="Kulüp Ekibi" description="Başkan, yöneticiler ve üyeler.">
          <div className="team-section-stack">
            <div className="team-section-block">
              <div className="team-section-heading">
                <span className="section-eyebrow">Başkan</span>
                <h3>Kulüp Başkanı</h3>
              </div>
              {groupedMembers.president ? renderMemberRow(groupedMembers.president, true) : <EmptyState title="Başkan ataması bekleniyor." description="Kulübün birincil yöneticisi henüz tanımlanmadı." icon="Üy" />}
            </div>

            <div className="team-section-block">
              <div className="team-section-heading">
                <span className="section-eyebrow">Yöneticiler</span>
                <h3>Yönetim Ekibi</h3>
              </div>
              {groupedMembers.assistants.length ? <div className="team-grid">{groupedMembers.assistants.map((member) => renderMemberRow(member))}</div> : <EmptyState title="Henüz yönetici yok." description="Yeni atamalar burada görünür." icon="Yn" />}
            </div>

            <div className="team-section-block">
              <div className="team-section-heading">
                <span className="section-eyebrow">Üyeler</span>
                <h3>Topluluk Üyeleri</h3>
              </div>
              {groupedMembers.members.length ? <div className="team-grid">{groupedMembers.members.map((member) => renderMemberRow(member))}</div> : <EmptyState title="Henüz üye yok." description="Yeni katılımlar burada görünür." icon="Üy" />}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Kulüp Özeti" description="Kısa görünüm.">
          <div className="insight-grid single-column-grid">
            <div className="insight-card">
              <strong>{clubData.highlightTitle || "Kulüp Vizyonu"}</strong>
              <span>{clubData.description || "Kulüp açıklaması hazırlanıyor."}</span>
            </div>
            <div className="insight-card">
              <strong>Başkan</strong>
              <span>{clubData.presidentName || "Tanımlanmadı"}{clubData.presidentEmail ? ` • ${clubData.presidentEmail}` : ""}</span>
              {groupedMembers.president ? <Link className="ghost-button link-button" to={`/organizers/${groupedMembers.president.userId}`}>Organizatör Profili</Link> : null}
            </div>
          </div>
        </SectionCard>
      </div>

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

      <SectionCard title="Detaylar">
        <div className="stat-grid club-detail-stats">
          <StatCard title="Aktif Üye" value={statsData.activeMemberCount} accent="teal" subtitle="Topluluk ağı" />
          <StatCard title="Etkinlik" value={statsData.eventCount} accent="blue" subtitle="Toplam üretim" />
          <StatCard title="Katılım" value={statsData.totalRegistrations} accent="orange" subtitle="Kayıt sayısı" />
          <StatCard title="Kulüp Puanı" value={<RatingStars value={clubData.averageRating} reviewCount={clubData.reviewCount} compact />} accent="rose" subtitle="Etkinlik değerlendirmeleri" />
        </div>
      </SectionCard>

      <ConfirmDialog
        open={Boolean(pendingDialog)}
        tone={pendingDialog?.type === "delete-club" ? "danger" : "warning"}
        title={
          pendingDialog?.type === "promote"
            ? "Yönetici yetkisi verilsin mi?"
            : pendingDialog?.type === "demote"
              ? "Yönetici yetkisi kaldırılsın mı?"
              : pendingDialog?.type === "transfer"
                ? "Başkanlık devredilsin mi?"
                : pendingDialog?.type === "remove"
                  ? "Üyelik kaldırılsın mı?"
                  : "Kulüp silinsin mi?"
        }
        description={
          pendingDialog?.type === "promote"
            ? `${pendingDialog?.member?.userFullName} kulüp yöneticisi olacak.`
            : pendingDialog?.type === "demote"
              ? `${pendingDialog?.member?.userFullName} tekrar üye rolüne dönecek.`
              : pendingDialog?.type === "transfer"
                ? "Bu işlem kulübün birincil yöneticisini değiştirir. Eski başkan yönetici rolüne düşer."
                : pendingDialog?.type === "remove"
                  ? `${pendingDialog?.member?.userFullName} kulüp listesinden çıkarılacak.`
                  : "Bu işlem geri alınamaz. Kulübe bağlı etkinlikler ve ilişkili kayıtlar da silinir."
        }
        confirmLabel={pendingDialog?.type === "transfer" ? "Başkanlığı Devret" : pendingDialog?.type === "delete-club" ? "Kulübü Sil" : "Onayla"}
        confirmDisabled={dialogRequiresPhrase && confirmText.trim().toUpperCase() !== "DEVRET"}
        loading={Boolean(busyAction)}
        onCancel={closeDialog}
        onConfirm={runMembershipAction}
      >
        {dialogRequiresPhrase ? (
          <label className="confirm-dialog-field">
            Onay için <strong>DEVRET</strong> yazın
            <input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} placeholder="DEVRET" />
          </label>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
