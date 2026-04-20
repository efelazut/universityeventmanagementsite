import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { RatingStars } from "../components/RatingStars";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { useCommunicationCenter } from "../context/CommunicationCenterContext";
import { useAsyncData } from "../hooks/useAsyncData";
import {
  cancelMyRegistration,
  createEventReview,
  createRegistration,
  decideRegistration,
  deleteEvent,
  fetchEventById,
  fetchEventRegistrations,
  fetchEventReviews,
  fetchMyEvents,
  markAttendance
} from "../services/resourceService";
import { formatEventDate, formatEventTimeRange, getEventVisualState } from "../utils/eventPresentation";

const eventFallbackImage = "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80";

function isOptionalAuthError(message) {
  const value = String(message || "").toLowerCase();
  return value.includes("user not found") || value.includes("401") || value.includes("unauthorized");
}

export function EventDetailPage() {
  const { id } = useParams();
  const { apiBaseUrl, user } = useAuth();
  const { openMessages } = useCommunicationCenter();
  const navigate = useNavigate();
  const eventQuery = useAsyncData(() => fetchEventById(id, apiBaseUrl), [id, apiBaseUrl]);
  const regQuery = useAsyncData(() => fetchEventRegistrations(id, apiBaseUrl), [id, apiBaseUrl]);
  const myEventsQuery = useAsyncData(
    () => (user?.token ? fetchMyEvents(user.token, apiBaseUrl) : Promise.resolve({ registeredEvents: [], attendedEvents: [], upcomingRegistrations: [] })),
    [user?.token, apiBaseUrl]
  );
  const reviewsQuery = useAsyncData(() => fetchEventReviews(id, apiBaseUrl), [id, apiBaseUrl]);
  const [feedback, setFeedback] = useState(null);
  const [reviewFilter, setReviewFilter] = useState("newest");
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [messageText, setMessageText] = useState("");
  const [detailImage, setDetailImage] = useState("");

  useEffect(() => {
    setDetailImage(eventQuery.data?.imageUrl || eventFallbackImage);
  }, [eventQuery.data?.imageUrl]);

  const hasOptionalActivityError = isOptionalAuthError(myEventsQuery.error);
  const activity = hasOptionalActivityError
    ? { registeredEvents: [], attendedEvents: [], upcomingRegistrations: [] }
    : (myEventsQuery.data || { registeredEvents: [], attendedEvents: [], upcomingRegistrations: [] });

  const registrationInfo = useMemo(() => {
    if (!user || !Array.isArray(activity.registeredEvents)) return null;
    return activity.registeredEvents.find((item) => item.id === Number(id)) || null;
  }, [activity.registeredEvents, id, user]);

  if (eventQuery.loading || regQuery.loading || reviewsQuery.loading) {
    return <div className="loading-state loading-state-large">Etkinlik ayrıntıları yükleniyor...</div>;
  }

  if (eventQuery.error || regQuery.error || reviewsQuery.error) {
    return <div className="error-panel">{eventQuery.error || regQuery.error || reviewsQuery.error}</div>;
  }

  const item = eventQuery.data;
  if (!item) {
    return (
      <SectionCard title="Etkinlik bilgisi şu anda gösterilemiyor" description="Temel bilgileri korumaya çalışıyoruz.">
        <EmptyState title="Etkinlik verisi bulunamadı." description="Listeye dönüp diğer etkinlikleri inceleyebilirsiniz." icon="Et" />
      </SectionCard>
    );
  }

  const registrations = Array.isArray(regQuery.data) ? regQuery.data : [];
  const reviews = Array.isArray(reviewsQuery.data) ? reviewsQuery.data : [];
  const visualState = getEventVisualState(item);
  const canManageEvent = Boolean(user && (user.role === "Admin" || (user.role === "ClubManager" && user.clubId === item.clubId)));
  const eventEnded = item.computedStatus === "Completed";
  const eventStarted = item.computedStatus === "Ongoing" || item.computedStatus === "Completed";
  const alreadyReviewed = reviews.some((review) => review.userId === user?.id);
  const canReview = user?.role === "Student" && registrationInfo?.attended && eventEnded && !alreadyReviewed;
  const sortedReviews = [...reviews].sort((left, right) => {
    if (reviewFilter === "highest") return right.rating - left.rating;
    return new Date(right.createdAt) - new Date(left.createdAt);
  });

  const handleRegister = async () => {
    try {
      await createRegistration({ eventId: Number(id), userId: user.id, attended: false }, user.token, apiBaseUrl);
      setFeedback({ type: "success", text: item.requiresApproval ? "Başvurunuz alındı." : "Etkinlik kaydınız oluşturuldu." });
      await Promise.all([eventQuery.reload(), regQuery.reload(), myEventsQuery.reload()]);
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Kayıt işlemi yapılamadı." });
    }
  };

  const handleDecision = async (registrationId, decision) => {
    try {
      await decideRegistration(registrationId, decision, user.token, apiBaseUrl);
      setFeedback({ type: "success", text: decision === "approve" ? "Başvuru onaylandı." : "Başvuru reddedildi." });
      await Promise.all([regQuery.reload(), eventQuery.reload()]);
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Başvuru kararı işlenemedi." });
    }
  };

  const handleCancelRegistration = async () => {
    try {
      await cancelMyRegistration(id, user.token, apiBaseUrl);
      setFeedback({ type: "success", text: "Etkinlik kaydınız iptal edildi." });
      await Promise.all([eventQuery.reload(), regQuery.reload(), myEventsQuery.reload()]);
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Kayıt iptali yapılamadı." });
    }
  };

  const handleAttendance = async (userId) => {
    try {
      await markAttendance(id, userId, user.token, apiBaseUrl);
      setFeedback({ type: "success", text: "Fiili katılım işlendi." });
      await Promise.all([eventQuery.reload(), regQuery.reload()]);
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Katılım işlenemedi." });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bu etkinliği kalıcı olarak silmek istediğinize emin misiniz?")) return;
    try {
      await deleteEvent(id, user.token, apiBaseUrl);
      navigate("/events", { replace: true });
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Etkinlik silinemedi." });
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    try {
      await createEventReview(id, { rating: Number(reviewForm.rating), comment: reviewForm.comment }, user.token, apiBaseUrl);
      setReviewForm({ rating: 5, comment: "" });
      setFeedback({ type: "success", text: "Değerlendirmeniz kaydedildi." });
      await Promise.all([reviewsQuery.reload(), eventQuery.reload()]);
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Değerlendirme kaydedilemedi." });
    }
  };

  const handleMessageClub = async () => {
    await openMessages({
      clubId: item.clubId,
      subject: item.clubName || "Kulüp ile iletişim",
      initialMessage: messageText || "Etkinlik hakkında bilgi rica ediyorum."
    });
  };

  return (
    <div className="page-stack">
      <section className="detail-hero detail-hero-rich event-detail-hero">
        <div className="event-detail-media">
          <img
            src={detailImage || item.imageUrl || eventFallbackImage}
            alt={item.title}
            onError={() => setDetailImage(eventFallbackImage)}
          />
        </div>
        <div className="event-detail-content">
          <div className="badge-row badge-row-spaced">
            <span className={`pill ${visualState.tone}`}>{visualState.badgeText}</span>
            {item.category ? <span className="pill tone-dark">{item.category}</span> : null}
            {item.requiresApproval ? <span className="pill tone-gold">Onaylı Katılım</span> : null}
          </div>
          <h1>{item.title}</h1>
          <p className="event-club-name event-club-name-detail">{item.clubName || "Kulüp bilgisi hazırlanıyor"}</p>
          <p>{item.description || "Etkinlik açıklaması şu anda güncelleniyor."}</p>

          <div className="event-detail-summary">
            <div><span>Tarih</span><strong>{formatEventDate(item.startDate)}</strong></div>
            <div><span>Saat</span><strong>{formatEventTimeRange(item.startDate, item.endDate)}</strong></div>
            <div><span>Yer</span><strong>{item.format === "Online" ? "Online" : item.locationDetails || `${item.roomName || "Salon bilgisi yok"} / ${item.building || "Kampüs"}`}</strong></div>
            <div><span>Kayıt tipi</span><strong>{item.requiresApproval ? "Başvuru + Onay" : "Doğrudan Katılım"}</strong></div>
          </div>

          <div className="inline-actions">
            {item.clubId ? <Link className="ghost-button link-button" to={`/clubs/${item.clubId}`}>Kulüp Sayfası</Link> : null}
            {canManageEvent ? <Link className="ghost-button link-button" to={`/events/${item.id}/edit`}>Etkinliği Düzenle</Link> : null}
            {canManageEvent ? <button className="ghost-button" onClick={handleDelete}>Etkinliği Sil</button> : null}
            {user?.role === "Student" && !registrationInfo ? (
              <button className="primary-button" onClick={handleRegister} disabled={eventStarted}>
                {item.requiresApproval ? "Başvuru Gönder" : "Katılım Oluştur"}
              </button>
            ) : null}
            {user?.role === "Student" && registrationInfo ? (
              <button className="ghost-button" onClick={handleCancelRegistration} disabled={eventStarted}>
                {eventStarted ? "Etkinlik Başladı" : "Kaydı İptal Et"}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {hasOptionalActivityError ? (
        <SectionCard title="Katılım durumu şu anda doğrulanamadı" description="Etkinlik bilgileri görünmeye devam ediyor.">
          <div className="notice-box">Kullanıcıya özel katılım bilgisi geçici olarak alınamadı. Genel etkinlik içeriği kullanılabilir durumda.</div>
        </SectionCard>
      ) : null}

      {feedback ? <div className={feedback.type === "error" ? "error-panel" : "notice-box"}>{feedback.text}</div> : null}

      <div className="stat-grid">
        <StatCard title="Kayıt" value={`${item.registrationCount}/${item.capacity}`} accent="teal" subtitle={`${item.pendingRegistrationCount} bekleyen başvuru`} />
        <StatCard title="Puan" value={<RatingStars value={item.averageRating} reviewCount={item.reviewCount} compact />} accent="blue" subtitle="Etkinlik ilgisi" />
        <StatCard title="Biçim" value={item.format} accent="orange" subtitle={item.campus || "Kampüs bilgisi"} />
        <StatCard title="Ücret" value={item.isFree ? "Ücretsiz" : `₺${item.price}`} accent="rose" subtitle={item.requiresApproval ? "Onaylı katılım" : "Hızlı kayıt"} />
      </div>

      <div className="two-column">
        <SectionCard title="Etkinlik Bilgileri" description="Planlama ve konum.">
          <div className="detail-table">
            <div><span>Kulüp</span><strong>{item.clubName || "Kulüp bilgisi yok"}</strong></div>
            <div><span>Kategori</span><strong>{item.category || "Genel"}</strong></div>
            <div><span>Kampüs</span><strong>{item.campus || "Belirtilmedi"}</strong></div>
            <div><span>Mekân</span><strong>{item.format === "Online" ? "Online" : item.locationDetails || item.roomName || "Yer bilgisi güncelleniyor"}</strong></div>
            <div><span>Salon</span><strong>{item.roomName || "Salon bilgisi yok"}</strong></div>
            <div><span>Fiili Katılım</span><strong>{item.actualAttendanceCount}</strong></div>
          </div>
        </SectionCard>

        <SectionCard title="İletişim Kur" description="Kulüple sayfadan ayrılmadan iletişim başlatın.">
          {user ? (
            <div className="management-form">
              <textarea rows="4" value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="Kulübe iletmek istediğiniz kısa mesaj" />
              <div className="form-actions">
                <button className="primary-button" type="button" onClick={handleMessageClub}>İletişim Kur</button>
              </div>
            </div>
          ) : (
            <EmptyState title="Mesaj için giriş yapın." description="Kulüp yöneticilerine soru göndermek için önce hesabınıza giriş yapın." icon="Ms" />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Başvuru ve Katılım Listesi" description="Onay ve yoklama görünümü.">
        <div className="stack-list">
          {registrations.length ? (
            registrations.map((registration) => (
              <div key={registration.id} className="list-row list-row-split">
                <div>
                  <strong>{registration.userFullName || `Öğrenci #${registration.userId}`}</strong>
                  <span>{registration.status} • {new Date(registration.registeredAt).toLocaleDateString("tr-TR")}</span>
                </div>
                <div className="inline-actions">
                  {canManageEvent && registration.status === "Pending" ? (
                    <>
                      <button className="mini-button" onClick={() => handleDecision(registration.id, "approve")}>Onayla</button>
                      <button className="ghost-button" onClick={() => handleDecision(registration.id, "reject")}>Reddet</button>
                    </>
                  ) : null}
                  {canManageEvent && registration.status === "Approved" && !registration.attended ? (
                    <button className="mini-button" onClick={() => handleAttendance(registration.userId)} disabled={!eventEnded}>
                      {eventEnded ? "Katılımı İşle" : "Etkinlik Sonrası"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="Henüz katılım kaydı yok." description="İlk başvuru geldiğinde burada görünecek." icon="Kt" />
          )}
        </div>
      </SectionCard>

      <div className="two-column">
        <SectionCard
          title="Değerlendirmeler"
          description="Yorumlar ve puanlar."
          action={
            <div className="inline-actions">
              <button className={`ghost-button ${reviewFilter === "newest" ? "is-selected" : ""}`} onClick={() => setReviewFilter("newest")}>En Yeni</button>
              <button className={`ghost-button ${reviewFilter === "highest" ? "is-selected" : ""}`} onClick={() => setReviewFilter("highest")}>En Yüksek</button>
            </div>
          }
        >
          <div className="review-summary">
            <RatingStars value={item.averageRating} reviewCount={item.reviewCount} />
          </div>
          <div className="stack-list">
            {sortedReviews.length ? (
              sortedReviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-card-head">
                    <strong>{review.userFullName}</strong>
                    <span>{review.rating}/5 • Katıldı</span>
                  </div>
                  <p>{review.comment || "Kısa değerlendirme bırakıldı."}</p>
                </div>
              ))
            ) : (
              <EmptyState title="Henüz değerlendirme yok." description="Etkinlik tamamlandığında yorumlar burada listelenecek." icon="Pn" />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Yorum Bırak" description="Katılan öğrenciler için.">
          {canReview ? (
            <form className="management-form" onSubmit={handleReviewSubmit}>
              <label>
                Puan
                <select value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: event.target.value })}>
                  <option value="5">5 - Çok İyi</option>
                  <option value="4">4 - İyi</option>
                  <option value="3">3 - Orta</option>
                  <option value="2">2 - Geliştirilmeli</option>
                  <option value="1">1 - Zayıf</option>
                </select>
              </label>
              <label>
                Kısa yorum
                <textarea rows="4" value={reviewForm.comment} onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })} placeholder="Etkinlik deneyiminizi paylaşın" />
              </label>
              <div className="form-actions">
                <button className="primary-button" type="submit">Değerlendirmeyi Gönder</button>
              </div>
            </form>
          ) : (
            <EmptyState title="Değerlendirme için uygun değilsiniz." description="Yalnızca etkinliğe katılan öğrenciler etkinlik sonrası yorum bırakabilir." icon="Pn" />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
