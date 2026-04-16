import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchNotifications, markNotificationRead } from "../services/resourceService";

function formatNotificationDate(value) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Tarih bilgisi yok";
  }

  return parsedDate.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function NotificationsPage() {
  const { apiBaseUrl, user } = useAuth();
  const notificationsQuery = useAsyncData(() => fetchNotifications(user.token, apiBaseUrl), [user?.token, apiBaseUrl]);
  const [processingId, setProcessingId] = useState(null);
  const notifications = Array.isArray(notificationsQuery.data) ? notificationsQuery.data : [];
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const handleRead = async (id) => {
    setProcessingId(id);
    try {
      await markNotificationRead(id, user.token, apiBaseUrl);
      await notificationsQuery.reload();
    } finally {
      setProcessingId(null);
    }
  };

  if (notificationsQuery.loading) {
    return <div className="loading-state loading-state-large">Bildirimler hazirlaniyor...</div>;
  }

  if (notificationsQuery.error) {
    return <div className="error-panel">{notificationsQuery.error}</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Bildirimler</p>
          <h1>Kulup ve etkinlik akisindaki guncellemeleri tek merkezden takip edin.</h1>
          <p>Uzun listelerde bile tasma yapmayan, okunakli ve duruma gore ayrisan bildirim akisi.</p>
        </div>
        <div className="status-panel status-panel-wide">
          <span>Okunmamis bildirim</span>
          <strong>{unreadCount}</strong>
          <small>Mesaj, basvuru karari ve etkinlik guncellemeleri burada toplanir.</small>
        </div>
      </section>

      <SectionCard title="Son bildirimler" description="Liste veri yokken bos durum, veri geldiyse dayanikli kart yapisiyla gosterilir.">
        <div className="stack-list">
          {notifications.length ? (
            notifications.map((notification) => {
              const content = (
                <div className={`list-row notification-row ${notification.isRead ? "notification-read" : ""}`}>
                  <div className="notification-copy">
                    <div className="thread-list-head">
                      <strong>{notification.title}</strong>
                      {!notification.isRead ? <span className="thread-badge">Yeni</span> : null}
                    </div>
                    <span>{notification.message}</span>
                    <small>{formatNotificationDate(notification.createdAt)}</small>
                  </div>
                  <div className="notification-actions">
                    {!notification.isRead ? (
                      <button
                        className="mini-button"
                        onClick={(event) => {
                          event.preventDefault();
                          handleRead(notification.id);
                        }}
                        disabled={processingId === notification.id}
                      >
                        {processingId === notification.id ? "Isleniyor..." : "Okundu isaretle"}
                      </button>
                    ) : null}
                  </div>
                </div>
              );

              if (notification.relatedLink) {
                return (
                  <Link key={notification.id} to={notification.relatedLink}>
                    {content}
                  </Link>
                );
              }

              return <div key={notification.id}>{content}</div>;
            })
          ) : (
            <EmptyState title="Henuz bildiriminiz yok." description="Kulup ve etkinlik hareketleri oldugunda burada gorunecek." />
          )}
        </div>
      </SectionCard>
    </div>
  );
}
